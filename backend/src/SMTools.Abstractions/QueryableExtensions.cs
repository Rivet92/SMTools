using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions;

namespace SMTools.Abstractions;

public static class QueryableExtensions
{
    public static async Task<PagedResponse<T>> ToPagedAsync<T>(
        this IQueryable<T> query,
        PagedRequest request,
        CancellationToken ct)
    {
        var total = await query.CountAsync(ct);

        var page = Math.Max(1, request.Page ?? 1);
        var pageSize = Math.Clamp(request.PageSize ?? 10, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResponse<T>(items, total, page, pageSize);
    }

    public static PagedResponse<T> ToPagedResponse<T>(
        this IList<T> items,
        PagedRequest request)
    {
        var page = Math.Max(1, request.Page ?? 1);
        var pageSize = Math.Clamp(request.PageSize ?? 10, 1, 100);

        var total = items.Count;
        var pagedItems = items
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new PagedResponse<T>(pagedItems, total, page, pageSize);
    }
}
