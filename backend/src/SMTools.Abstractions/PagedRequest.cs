namespace SMTools.Abstractions;

public record PagedRequest
{
    public int? Page { get; set; } = 1;
    public int? PageSize { get; set; } = 10;
}

public record PagedResponse<T>(List<T> Items, int TotalCount, int Page, int PageSize);
