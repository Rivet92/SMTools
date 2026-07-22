using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Kanban.Data;
using SMTools.Kanban.DTOs.Hubs;

using SMTools.Kanban.Models;

namespace SMTools.Kanban.Services;

public sealed class KanbanCommentService : IKanbanCommentService
{
    private readonly IKanbanRepository _repo;
    private readonly IStateBuilder<KanbanRoomStateDto> _stateBuilder;
    private readonly IUnitOfWork<KanbanDbContext> _uow;

    public KanbanCommentService(IKanbanRepository repo, IStateBuilder<KanbanRoomStateDto> stateBuilder, IUnitOfWork<KanbanDbContext> uow)
    {
        _repo = repo;
        _stateBuilder = stateBuilder;
        _uow = uow;
    }

    public async Task<KanbanRoomStateDto> AddCommentAsync(
        Guid roomId, Guid cardId, string content,
        Guid authorParticipantId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new BusinessRuleException("Content is required.");

        var card = await _repo.GetCardAsync(cardId, roomId, ct);
        if (card is null)
            throw new NotFoundException<KanbanCard>(cardId);

        var comment = new KanbanCardComment
        {
            Id = Guid.NewGuid(),
            CardId = cardId,
            AuthorParticipantId = authorParticipantId,
            Content = content.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        await _repo.AddCommentAsync(comment, ct);
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, authorParticipantId, ct);
    }

    public async Task<KanbanRoomStateDto> UpdateCommentAsync(
        Guid roomId, Guid cardId, Guid commentId, string content,
        Guid callerParticipantId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new BusinessRuleException("Content is required.");

        var comment = await GetCommentOrThrow(cardId, commentId, ct);
        await EnsureCommentAuthorOrAdmin(callerParticipantId, comment.AuthorParticipantId, roomId, ct);

        comment.Content = content.Trim();
        comment.UpdatedAt = DateTimeOffset.UtcNow;
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    public async Task<KanbanRoomStateDto> DeleteCommentAsync(
        Guid roomId, Guid cardId, Guid commentId,
        Guid callerParticipantId, CancellationToken ct)
    {
        var comment = await GetCommentOrThrow(cardId, commentId, ct);
        await EnsureCommentAuthorOrAdmin(callerParticipantId, comment.AuthorParticipantId, roomId, ct);

        await _repo.DeleteCommentAsync(comment);
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    private async Task<KanbanCardComment> GetCommentOrThrow(Guid cardId, Guid commentId, CancellationToken ct)
    {
        var comment = await _repo.GetCommentAsync(cardId, commentId, ct);
        return comment ?? throw new NotFoundException<KanbanCardComment>(commentId);
    }

    private async Task EnsureCommentAuthorOrAdmin(
        Guid callerParticipantId, Guid authorParticipantId, Guid roomId, CancellationToken ct)
    {
        if (callerParticipantId == authorParticipantId)
            return;

        var caller = await _repo.GetParticipantAsync(callerParticipantId, roomId, ct);
        if (caller is null || (!caller.IsOwner && !caller.IsAdmin))
            throw new ForbiddenException("Only the room owner, an admin, or the comment author can perform this action.");
    }

}
