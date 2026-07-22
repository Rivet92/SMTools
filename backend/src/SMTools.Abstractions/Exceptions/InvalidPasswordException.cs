namespace SMTools.Abstractions.Exceptions;

public sealed class InvalidPasswordException()
    : BusinessRuleException("Invalid password.")
{
    public override string ErrorCode => "invalid_password";
}
