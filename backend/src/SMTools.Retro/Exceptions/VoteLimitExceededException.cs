using SMTools.Abstractions.Exceptions;

namespace SMTools.Retro.Exceptions;

public sealed class VoteLimitExceededException(int max)
    : BusinessRuleException($"You have used all your voting points ({max}).")
{
    public override string ErrorCode => "vote_limit_exceeded";
}
