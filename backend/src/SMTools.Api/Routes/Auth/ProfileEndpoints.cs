using Microsoft.AspNetCore.Mvc;
using SMTools.Abstractions;
using SMTools.Identity.DTOs;
using SMTools.Identity.Models;
using SMTools.Identity.Services;

namespace SMTools.Api.Routes;

public static partial class AuthEndpoints
{
    public static RouteGroupBuilder MapProfileEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/me", async (IIdentityService identityService, ILogger<Program> logger, HttpContext context, CancellationToken cancellationToken) =>
        {
            var userId = context.GetRequiredUserId();

            var currentUser = await identityService.GetUserByIdAsync(userId, cancellationToken);

            if (currentUser is null)
            {
                LogUserNotFound(logger, userId);
                return Results.Unauthorized();
            }

            return Results.Ok(IdentityService.MapUserResponse(currentUser));
        })
        .WithName("GetCurrentUser")
        .WithTags("Auth")
        .Produces<UserResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .RequireAuthorization();

        group.MapPut("/profile", async (
            HttpContext context,
            [FromBody] UpdateProfileRequest request,
            [FromServices] IIdentityService identityService,
            CancellationToken ct) =>
        {
            var userId = context.GetRequiredUserId();

            User user;
            try
            {
                user = await identityService.UpdateProfileAsync(userId, request.Name, request.AvatarUrl, ct);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound(new ProblemDetails
                {
                    Status = 404,
                    Title = "User not found",
                    Detail = $"User with id {userId} was not found in the database."
                });
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new ProblemDetails
                {
                    Status = 400,
                    Title = "Invalid avatar URL",
                    Detail = ex.Message
                });
            }

            await RefreshAuthCookie(context, user);

            return Results.Ok(IdentityService.MapUserResponse(user));
        })
        .RequireAuthorization()
        .WithName("UpdateProfile")
        .WithTags("Auth")
        .WithValidation<UpdateProfileRequest>();

        group.MapPost("/avatar", async (
            HttpContext context,
            IFormFile file,
            [FromServices] IIdentityService identityService,
            CancellationToken ct) =>
        {
            var userId = context.GetRequiredUserId();

            if (file is null || file.Length == 0)
                return Results.BadRequest(new ProblemDetails
                {
                    Status = 400,
                    Title = "No file",
                    Detail = "No file was provided."
                });

            if (file.Length > 2 * 1024 * 1024)
                return Results.BadRequest(new ProblemDetails
                {
                    Status = 400,
                    Title = "File too large",
                    Detail = "Avatar must be 2 MB or less."
                });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext is not ".jpg" and not ".jpeg" and not ".png")
                return Results.BadRequest(new ProblemDetails
                {
                    Status = 400,
                    Title = "Invalid file type",
                    Detail = "Only JPG and PNG files are allowed."
                });

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms, ct);
            var bytes = ms.ToArray();

            User user;
            try
            {
                user = await identityService.UpdateAvatarAsync(userId, bytes, file.ContentType, ct);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound(new ProblemDetails
                {
                    Status = 404,
                    Title = "User not found",
                    Detail = $"User with id {userId} was not found in the database."
                });
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new ProblemDetails
                {
                    Status = 400,
                    Title = "Invalid image",
                    Detail = ex.Message
                });
            }

            await RefreshAuthCookie(context, user);

            return Results.Ok(IdentityService.MapUserResponse(user));
        })
        .RequireAuthorization()
        .WithName("UploadAvatar")
        .WithTags("Auth")
        .DisableAntiforgery();

        return group;
    }
}
