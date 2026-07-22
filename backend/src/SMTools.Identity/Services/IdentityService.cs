using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SMTools.Abstractions;
using SMTools.Abstractions.ValueObjects;
using SMTools.Identity.Data;
using SMTools.Identity.DTOs;
using SMTools.Identity.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace SMTools.Identity.Services;

public sealed class IdentityService : IIdentityService
{
    private readonly IdentityDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger _logger;

    public IdentityService(IdentityDbContext db, IWebHostEnvironment env, ILogger<IdentityService> logger)
    {
        _db = db;
        _env = env;
        _logger = logger;
    }

    public async Task<User?> GetUserByIdAsync(Guid userId, CancellationToken ct)
    {
        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
    }

    public async Task<User?> GetUserByExternalIdAsync(string provider, string subject, CancellationToken ct)
    {
        return await _db.Users
            .FirstOrDefaultAsync(u => u.Provider == provider && u.ProviderUserId == subject, ct);
    }

    public async Task<User> CreateUserAsync(string provider, string subject, string email, string displayName, string? avatarUrl, CancellationToken ct)
    {
        var user = User.Create(provider, subject, displayName, email, avatarUrl);
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return user;
    }

    public async Task<User> UpdateProfileAsync(Guid userId, string? displayName, string? avatarUrl, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException($"User with id {userId} not found.");

        if (displayName is not null)
        {
            user.Name = displayName.Trim();
        }

        if (avatarUrl is not null)
        {
            if (string.IsNullOrWhiteSpace(avatarUrl))
            {
                DeleteAvatarFile(userId);
                user.UserAvatarUrl = !string.IsNullOrEmpty(user.OAuthAvatarUrl)
                    ? AvatarUrl.Create(user.OAuthAvatarUrl)
                    : null;
            }
            else
            {
                var avatar = AvatarUrl.Create(avatarUrl.Trim());
                if (avatar is null)
                    throw new ArgumentException("The provided avatar URL is not a valid HTTPS URL or relative path.");
                DeleteAvatarFile(userId);
                user.UserAvatarUrl = avatar;
            }
        }

        await _db.SaveChangesAsync(ct);
        return user;
    }

    public async Task<User> UpdateAvatarAsync(Guid userId, byte[] avatarBytes, string contentType, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException($"User with id {userId} not found.");

        var header = avatarBytes.AsSpan(0, Math.Min(8, avatarBytes.Length));
        if (!IsValidImageHeader(header))
            throw new ArgumentException("The file does not appear to be a valid JPG or PNG image.");

        var fileName = $"{userId:N}.jpg";
        var avatarsDir = Path.Combine(_env.WebRootPath, "avatars");
        Directory.CreateDirectory(avatarsDir);

        DeleteAvatarFile(userId);

        var filePath = Path.Combine(avatarsDir, fileName);
        using var ms = new MemoryStream(avatarBytes);
        using var image = await Image.LoadAsync(ms, ct);
        image.Mutate(x => x.Resize(new ResizeOptions
        {
            Size = new Size(128, 128),
            Mode = ResizeMode.Max,
            Sampler = KnownResamplers.Lanczos3,
        }));
        var encoder = new JpegEncoder { Quality = 80 };
        await image.SaveAsync(filePath, encoder, ct);

        var cacheBuster = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var avatarUrl = $"/avatars/{fileName}?t={cacheBuster}";
        user.UserAvatarUrl = AvatarUrl.Create(avatarUrl);

        await _db.SaveChangesAsync(ct);
        return user;
    }

    public static List<Claim> CreateClaims(User user)
    {
        return new List<Claim>
        {
            new(SMToolsClaimTypes.UserId, user.Id.ToString("N")),
            new(SMToolsClaimTypes.Provider, user.Provider),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email),
            new(SMToolsClaimTypes.AvatarUrl, user.UserAvatarUrl?.ToString() ?? string.Empty),
        };
    }

    public static UserResponse MapUserResponse(User user) => new(
        user.Id,
        user.Provider,
        user.Name,
        user.Email,
        user.UserAvatarUrl?.ToString() ?? string.Empty);

    private void DeleteAvatarFile(Guid userId)
    {
        var avatarsDir = Path.Combine(_env.WebRootPath, "avatars");
        if (!Directory.Exists(avatarsDir))
            return;

        foreach (var existing in Directory.EnumerateFiles(avatarsDir, $"{userId:N}.*"))
        {
            try
            {
                File.Delete(existing);
            }
            catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
            {
                _logger.LogWarning(ex, "Failed to delete old avatar file: {Path}", existing);
            }
        }
    }

    private static bool IsValidImageHeader(ReadOnlySpan<byte> header)
    {
        if (header.Length < 3)
            return false;
        return header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF
            || header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47;
    }
}
