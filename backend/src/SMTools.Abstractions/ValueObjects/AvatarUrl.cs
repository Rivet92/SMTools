namespace SMTools.Abstractions.ValueObjects;

public sealed class AvatarUrl
{
    public string Value { get; }

    private AvatarUrl(string value)
    {
        Value = value;
    }

    public static AvatarUrl? Create(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return null;

        if (Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            if (uri.Scheme == Uri.UriSchemeHttps)
                return new AvatarUrl(url);
            return null;
        }

        if (url.StartsWith('/'))
            return new AvatarUrl(url);

        return null;
    }

    public override string ToString() => Value;
}
