using System.Collections.Concurrent;
using Microsoft.Extensions.Configuration;

namespace SMTools.Abstractions.Hubs;

public sealed class RoomVersionStore : IRoomVersionStore, IDisposable
{
    private readonly ConcurrentDictionary<Guid, RoomVersionEntry> _versions = new();
    private readonly TimeSpan _entryTtl;
    private readonly Timer _cleanupTimer;
    private bool _disposed;

    public RoomVersionStore()
        : this(TimeSpan.FromHours(1))
    {
    }

    public RoomVersionStore(IConfiguration? configuration)
        : this(TimeSpan.FromMinutes(configuration?.GetValue<int>("RoomVersionStore:DefaultTtlMinutes", 60) ?? 60))
    {
    }

    public RoomVersionStore(TimeSpan entryTtl)
    {
        _entryTtl = entryTtl;
        _cleanupTimer = new Timer(CleanupExpiredEntries, null, entryTtl, entryTtl);
    }

    public int NextVersion(Guid roomId)
    {
        var entry = _versions.GetOrAdd(roomId, _ => new RoomVersionEntry(_entryTtl));
        entry.Refresh();
        return Interlocked.Increment(ref entry.Version);
    }

    public int GetCurrentVersion(Guid roomId) =>
        _versions.TryGetValue(roomId, out var entry) ? entry.Version : 0;

    public void Clear(Guid roomId) =>
        _versions.TryRemove(roomId, out _);

    public int Count => _versions.Count;

    private void CleanupExpiredEntries(object? state)
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var kvp in _versions)
        {
            if (kvp.Value.ExpiresAt <= now)
            {
                _versions.TryRemove(kvp.Key, out _);
            }
        }
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _cleanupTimer.Dispose();
            _disposed = true;
        }
    }

    private sealed class RoomVersionEntry
    {
        public int Version;
        public DateTimeOffset ExpiresAt { get; private set; }
        private readonly TimeSpan _ttl;

        public RoomVersionEntry(TimeSpan ttl)
        {
            _ttl = ttl;
            ExpiresAt = DateTimeOffset.UtcNow.Add(ttl);
        }

        public void Refresh()
        {
            ExpiresAt = DateTimeOffset.UtcNow.Add(_ttl);
        }
    }
}
