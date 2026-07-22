using SMTools.Identity.Data;
using SMTools.Identity.DTOs;
using SMTools.Identity.Models;

namespace SMTools.Identity.Services;

public interface IIdentityService
{
    Task<User?> GetUserByIdAsync(Guid userId, CancellationToken ct);
    Task<User?> GetUserByExternalIdAsync(string provider, string subject, CancellationToken ct);
    Task<User> CreateUserAsync(string provider, string subject, string email, string displayName, string? avatarUrl, CancellationToken ct);
    Task<User> UpdateProfileAsync(Guid userId, string? displayName, string? avatarUrl, CancellationToken ct);
    Task<User> UpdateAvatarAsync(Guid userId, byte[] avatarBytes, string contentType, CancellationToken ct);
}
