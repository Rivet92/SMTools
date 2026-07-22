using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc;
using SMTools.Abstractions.Exceptions;

#pragma warning disable CA1848 // LoggerMessage delegates are not needed in middleware

namespace SMTools.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title, logLevel, code) = exception switch
        {
            ForbiddenException => (StatusCodes.Status403Forbidden, exception.Message, LogLevel.Debug, ((DomainException)exception).ErrorCode),
            DomainException de => (de.HttpStatusCode, de.Message, LogLevel.Debug, de.ErrorCode),
            BadHttpRequestException => (StatusCodes.Status400BadRequest, "Invalid request", LogLevel.Debug, "bad_request"),
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Resource not found", LogLevel.Debug, "not_found"),
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "Unauthorized", LogLevel.Debug, "unauthorized"),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred", LogLevel.Error, "internal_error"),
        };

        if (_logger.IsEnabled(logLevel))
            _logger.Log(logLevel, exception, "Request {Method} {Path} failed: {Message}",
                context.Request.Method, context.Request.Path, exception.Message);

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = _env.IsDevelopment()
                ? exception.Message
                : "Please try again later. If the problem persists, contact support.",
            Instance = context.Request.Path,
        };

        problemDetails.Extensions["code"] = code;

        return context.Response.WriteAsJsonAsync(problemDetails);
    }
}
