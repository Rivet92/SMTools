using Microsoft.AspNetCore.Http;

namespace SMTools.Abstractions.Exceptions;

public class BusinessRuleException : DomainException
{
    public BusinessRuleException(string message) : base(message) { }

    public BusinessRuleException(string rule, string details)
        : base($"Business rule '{rule}' violated: {details}")
    {
        Rule = rule;
    }

    public string? Rule { get; }

    public override int HttpStatusCode => StatusCodes.Status400BadRequest;
    public override string ErrorCode => "business_rule";
}
