namespace SMTools.Identity.DTOs;

public sealed record UserResponse(
    Guid Id,
    string Provider,
    string Name,
    string Email,
    string AvatarUrl);
