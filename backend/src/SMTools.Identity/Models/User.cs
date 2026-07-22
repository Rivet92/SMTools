using SMTools.Abstractions.ValueObjects;

namespace SMTools.Identity.Models;

public sealed class User
{
    public Guid Id { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string ProviderUserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLoginAt { get; private set; }

    public AvatarUrl? UserAvatarUrl { get; set; }
    public string? OAuthAvatarUrl { get; set; }

    public ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();

    public void UpdateProfile(string name, string email, string? avatarUrl)
    {
        Name = name;
        Email = email;
        UserAvatarUrl = AvatarUrl.Create(avatarUrl);
        if (avatarUrl is not null && Uri.TryCreate(avatarUrl, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps)
        {
            OAuthAvatarUrl = avatarUrl;
        }
    }

    public void RecordLogin() => LastLoginAt = DateTimeOffset.UtcNow;

    public static User Create(string provider, string providerUserId, string name, string email, string? avatarUrl)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(provider);
        ArgumentException.ThrowIfNullOrWhiteSpace(providerUserId);
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        var oauthUrl = !string.IsNullOrEmpty(avatarUrl)
            && Uri.TryCreate(avatarUrl, UriKind.Absolute, out var uri)
            && uri.Scheme == Uri.UriSchemeHttps
            ? avatarUrl
            : null;

        return new User
        {
            Id = Guid.NewGuid(),
            Provider = provider,
            ProviderUserId = providerUserId,
            Name = name,
            Email = email ?? string.Empty,
            UserAvatarUrl = AvatarUrl.Create(avatarUrl),
            OAuthAvatarUrl = oauthUrl,
        };
    }
}
