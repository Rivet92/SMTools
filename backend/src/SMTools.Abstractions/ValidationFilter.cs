using FluentValidation;
using Microsoft.AspNetCore.Http;

namespace SMTools.Abstractions;

public sealed class ValidationFilter<T> : IEndpointFilter
{
    private readonly IValidator<T> _validator;

    public ValidationFilter(IValidator<T> validator)
    {
        _validator = validator;
    }

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var arg = context.Arguments.OfType<T>().FirstOrDefault();
        if (arg is null) return await next(context);

        var result = await _validator.ValidateAsync(arg);
        if (!result.IsValid)
        {
            return Results.ValidationProblem(
                result.ToDictionary(),
                statusCode: StatusCodes.Status400BadRequest);
        }

        return await next(context);
    }
}
