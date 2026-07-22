using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Options;

namespace SMTools.Identity.Auth;

public sealed class ConfigureCookieSessionStore : IPostConfigureOptions<CookieAuthenticationOptions>
{
    private readonly DatabaseTicketStore _ticketStore;

    public ConfigureCookieSessionStore(DatabaseTicketStore ticketStore)
    {
        _ticketStore = ticketStore;
    }

    public void PostConfigure(string? name, CookieAuthenticationOptions options)
    {
        options.SessionStore = _ticketStore;
    }
}
