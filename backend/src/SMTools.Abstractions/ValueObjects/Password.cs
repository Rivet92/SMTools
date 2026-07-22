using System.Security.Cryptography;

namespace SMTools.Abstractions.ValueObjects;

public sealed class Password
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 600_000;
    private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

    public string Hash { get; }

    private Password(string hash)
    {
        Hash = hash;
    }

    public static Password Create(string plaintext)
    {
        if (string.IsNullOrWhiteSpace(plaintext))
            throw new ArgumentException("Password cannot be null, empty, or whitespace.", nameof(plaintext));
        if (plaintext.Length < 8 || plaintext.Length > 128)
            throw new ArgumentException($"Password must be between 8 and 128 characters long. Provided length: {plaintext.Length}.", nameof(plaintext));

        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            plaintext,
            salt,
            Iterations,
            Algorithm,
            HashSize);

        return new Password($"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}");
    }

    public static Password FromHash(string hash)
    {
        return new Password(hash);
    }

    public bool Verify(string plaintext)
    {
        var parts = Hash.Split('.');
        if (parts.Length != 2)
            return false;

        var salt = Convert.FromBase64String(parts[0]);
        var storedHash = Convert.FromBase64String(parts[1]);

        var computedHash = Rfc2898DeriveBytes.Pbkdf2(
            plaintext,
            salt,
            Iterations,
            Algorithm,
            HashSize);

        return CryptographicOperations.FixedTimeEquals(storedHash, computedHash);
    }

    public static bool Verify(string? hash, string plaintext)
    {
        if (hash is null)
            return false;
        var password = FromHash(hash);
        return password.Verify(plaintext);
    }
}
