using SMTools.Abstractions;
using System.Text.Json.Serialization;
using SMTools.Abstractions.ValueObjects;

namespace SMTools.Retro.Models;

public enum RetroPhase
{
    Gathering = 0,
    Grouping = 1,
    Voting = 2,
    Actions = 3,
}

public sealed class RetroRoom : IRoom
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public string? PasswordHash
    {
        get => RoomPassword?.Hash;
        set => RoomPassword = value is not null ? Password.FromHash(value) : null;
    }

    public Guid TemplateId { get; set; }

    [JsonIgnore]
    public RetroTemplate Template { get; set; } = null!;

    public RetroPhase Phase { get; private set; }

    public void TransitionTo(RetroPhase newPhase)
    {
        if (!Enum.IsDefined(typeof(RetroPhase), (int)newPhase))
            throw new Exceptions.InvalidPhaseTransitionException((int)Phase, (int)newPhase);

        if (Phase == newPhase)
            throw new Exceptions.InvalidPhaseTransitionException((int)Phase, (int)newPhase);

        Phase = newPhase;
    }

    [JsonIgnore]
    public Password? RoomPassword { get; set; }

    [JsonIgnore]
    public ICollection<RetroRoomParticipant> Participants { get; set; } = new List<RetroRoomParticipant>();

    [JsonIgnore]
    public ICollection<RetroCard> Cards { get; set; } = new List<RetroCard>();

    [JsonIgnore]
    public ICollection<RetroCardGroup> Groups { get; set; } = new List<RetroCardGroup>();

    [JsonIgnore]
    public ICollection<RetroVote> Votes { get; set; } = new List<RetroVote>();

    [JsonIgnore]
    public ICollection<RetroActionItem> ActionItems { get; set; } = new List<RetroActionItem>();

    [JsonIgnore]
    public bool HasPassword => RoomPassword is not null;
}
