using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions;
using SMTools.Api.Data;

namespace SMTools.Api.Routes;

public static class AuditEndpoints
{
    public static RouteGroupBuilder MapAuditEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/audit").RequireAuthorization();

        group.MapGet("/", async (
            AuditDbContext db,
            HttpContext httpContext,
            string? action,
            string? entityType,
            int page = 1,
            int pageSize = 50,
            CancellationToken cancellationToken = default) =>
        {
            var userId = httpContext.GetRequiredUserId();

            var query = db.AuditEntries
                .AsNoTracking()
                .Where(a => a.UserId == userId);

            if (!string.IsNullOrWhiteSpace(action))
                query = query.Where(a => a.Action == action);
            if (!string.IsNullOrWhiteSpace(entityType))
                query = query.Where(a => a.EntityType == entityType);

            query = query.OrderByDescending(a => a.Timestamp);

            var result = await query.ToPagedAsync(
                new PagedRequest { Page = page, PageSize = pageSize },
                cancellationToken);

            return Results.Ok(result);
        })
        .WithName("GetAuditLog")
        .WithTags("Audit")
        .Produces<PagedResponse<AuditEntry>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        return api;
    }
}
