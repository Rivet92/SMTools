using Microsoft.Extensions.Caching.Memory;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.DTOs.Apis;
using SMTools.Retro.Data;
using SMTools.Retro.DTOs.Apis;

namespace SMTools.Api;

public sealed class MasterDataCache
{
    private readonly IMemoryCache _cache;
    private readonly IServiceScopeFactory _scopeFactory;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    public MasterDataCache(IMemoryCache cache, IServiceScopeFactory scopeFactory)
    {
        _cache = cache;
        _scopeFactory = scopeFactory;
    }

    public async Task<List<PlanningPokerDeckDto>> GetDecksAsync(CancellationToken ct)
    {
        return await _cache.GetOrCreateAsync("decks", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;
            using var scope = _scopeFactory.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<IPlanningPokerRepository>();
            return await repo.GetDecksAsync(ct);
        }) ?? [];
    }

    public async Task<List<RetroTemplateResponse>> GetTemplatesAsync(CancellationToken ct)
    {
        return await _cache.GetOrCreateAsync("retro-templates", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;
            using var scope = _scopeFactory.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<IRetroRepository>();
            return await repo.GetTemplatesAsync(ct);
        }) ?? [];
    }

}
