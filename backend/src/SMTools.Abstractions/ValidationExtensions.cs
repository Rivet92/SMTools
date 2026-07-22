using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace SMTools.Abstractions;

public static class ValidationExtensions
{
    public static RouteHandlerBuilder WithValidation<T>(this RouteHandlerBuilder builder)
    {
        return builder.AddEndpointFilter<ValidationFilter<T>>();
    }
}
