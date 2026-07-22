using SMTools.Abstractions.Exceptions;

namespace SMTools.Retro.Exceptions;

public sealed class InvalidPhaseTransitionException(int from, int to)
    : BusinessRuleException($"Cannot transition from phase {from} to {to}.")
{
    public override string ErrorCode => "invalid_phase_transition";
}
