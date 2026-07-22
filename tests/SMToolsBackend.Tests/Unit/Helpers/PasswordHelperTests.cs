using FluentAssertions;
using SMTools.Abstractions.ValueObjects;

namespace SMToolsBackend.Tests.Unit.Helpers;

public sealed class PasswordTests
{
    [Fact]
    public void Create_ReturnsDifferentHash_EachCall()
    {
        var password1 = Password.Create("password123");
        var password2 = Password.Create("password123");

        password1.Hash.Should().NotBe(password2.Hash);
    }

    [Fact]
    public void Verify_CorrectPassword_ReturnsTrue()
    {
        var password = Password.Create("correct-password");

        var result = password.Verify("correct-password");

        result.Should().BeTrue();
    }

    [Fact]
    public void Verify_WrongPassword_ReturnsFalse()
    {
        var password = Password.Create("correct-password");

        var result = password.Verify("wrong-password");

        result.Should().BeFalse();
    }

    [Fact]
    public void Verify_TamperedHash_ReturnsFalse()
    {
        var password = Password.Create("password");
        var parts = password.Hash.Split('.');
        var tamperedHash = $"AAAA{parts[0]}.{parts[1]}";

        var result = Password.FromHash(tamperedHash).Verify("password");

        result.Should().BeFalse();
    }

    [Fact]
    public void StaticVerify_CorrectPassword_ReturnsTrue()
    {
        var password = Password.Create("correct-password");

        var result = Password.Verify(password.Hash, "correct-password");

        result.Should().BeTrue();
    }

    [Fact]
    public void StaticVerify_NullHash_ReturnsFalse()
    {
        var result = Password.Verify(null, "password");

        result.Should().BeFalse();
    }

    [Fact]
    public void StaticVerify_InvalidFormat_ReturnsFalse()
    {
        var result = Password.Verify("invalid-hash-format", "password");

        result.Should().BeFalse();
    }

    [Fact]
    public void StaticVerify_EmptyHash_ReturnsFalse()
    {
        var result = Password.Verify("", "password");

        result.Should().BeFalse();
    }
}
