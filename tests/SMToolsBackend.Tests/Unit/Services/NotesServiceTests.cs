using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Notes.Data;
using SMTools.Notes.DTOs;
using SMTools.Abstractions.Exceptions;
using SMTools.Notes.Models;
using SMTools.Notes.Services;

namespace SMToolsBackend.Tests.Unit.Services;

public sealed class NotesServiceTests
{
    private readonly INotesRepository _repo = Substitute.For<INotesRepository>();
    private readonly IUnitOfWork<NotesDbContext> _uow = Substitute.For<IUnitOfWork<NotesDbContext>>();
    private readonly ILogger<NotesService> _logger = Substitute.For<ILogger<NotesService>>();
    private readonly NotesService _sut;

    public NotesServiceTests()
    {
        _sut = new NotesService(_repo, _uow, _logger);
    }

    [Fact]
    public async Task CreateNoteAsync_Should_Create_And_Return_NoteDto()
    {
        var userId = Guid.NewGuid();
        var request = new CreateNoteRequest("Test Title", "Test Content");

        _repo.GetMaxPositionAsync(userId, Arg.Any<CancellationToken>()).Returns(-1);

        var result = await _sut.CreateNoteAsync(userId, request, CancellationToken.None);

        result.Title.Should().Be("Test Title");
        result.Content.Should().Be("Test Content");
        result.UserId.Should().Be(userId);
        result.Position.Should().Be(0);
        result.IsArchived.Should().BeFalse();
        result.Id.Should().NotBeEmpty();

        await _repo.Received(1).AddNoteAsync(Arg.Any<Note>(), Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetNotesPagedAsync_Should_Return_PagedNoteDtos()
    {
        var userId = Guid.NewGuid();
        var paging = new PagedRequest { Page = 1, PageSize = 10 };
        var noteDtos = new List<NoteDto>
        {
            new(Guid.NewGuid(), userId, "Note 1", null, false, 0, DateTimeOffset.UtcNow, null),
        };
        var expected = new PagedResponse<NoteDto>(noteDtos, 1, 1, 10);

        _repo.GetNotesPagedAsync(userId, null, paging, Arg.Any<CancellationToken>()).Returns(expected);

        var result = await _sut.GetNotesPagedAsync(userId, null, paging, CancellationToken.None);

        result.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task UpdateNoteAsync_Should_Update_Title()
    {
        var noteId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var existingNote = new Note
        {
            Id = noteId,
            UserId = userId,
            Title = "Old Title",
            Content = "Old Content",
        };

        _repo.GetNoteForUpdateAsync(noteId, userId, Arg.Any<CancellationToken>()).Returns(existingNote);

        var result = await _sut.UpdateNoteAsync(noteId, userId, new UpdateNoteRequest("New Title", null), CancellationToken.None);

        result.Title.Should().Be("New Title");
        result.Content.Should().Be("Old Content");
        result.Id.Should().Be(noteId);
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteNoteAsync_Should_Throw_When_Not_Found()
    {
        _repo.GetNoteForUpdateAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((Note?)null);

        var act = () => _sut.DeleteNoteAsync(Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException<Note>>();
    }

    [Fact]
    public async Task DeleteNoteAsync_Should_Delete_When_Found()
    {
        var noteId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var note = new Note { Id = noteId, UserId = userId };

        _repo.GetNoteForUpdateAsync(noteId, userId, Arg.Any<CancellationToken>()).Returns(note);

        await _sut.DeleteNoteAsync(noteId, userId, CancellationToken.None);

        await _repo.Received(1).DeleteNoteAsync(noteId, Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ToggleArchiveAsync_Should_Toggle_IsArchived()
    {
        var noteId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var note = new Note
        {
            Id = noteId,
            UserId = userId,
        };

        _repo.GetNoteForUpdateAsync(noteId, userId, Arg.Any<CancellationToken>()).Returns(note);

        var result = await _sut.ToggleArchiveAsync(noteId, userId, CancellationToken.None);

        result.IsArchived.Should().BeTrue();
        result.Id.Should().Be(noteId);
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ReorderNotesAsync_Should_Update_Positions()
    {
        var userId = Guid.NewGuid();
        var note1Id = Guid.NewGuid();
        var note2Id = Guid.NewGuid();

        var notes = new List<Note>
        {
            new() { Id = note1Id, UserId = userId, Position = 0 },
            new() { Id = note2Id, UserId = userId, Position = 1 },
        };

        _repo.GetNotesByIdsForReorderAsync(Arg.Any<List<Guid>>(), userId, Arg.Any<CancellationToken>())
            .Returns(notes);

        var request = new ReorderNotesRequest([
            new NoteReorderItem(note1Id, 1),
            new NoteReorderItem(note2Id, 0),
        ]);

        await _sut.ReorderNotesAsync(userId, request, CancellationToken.None);

        notes[0].Position.Should().Be(1);
        notes[1].Position.Should().Be(0);
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
