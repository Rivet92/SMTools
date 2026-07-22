using FluentValidation;

namespace SMTools.Abstractions.Validation;

public sealed class CreateRoomRequestValidator<T> : AbstractValidator<T>
    where T : ICreateRoomRequest
{
    public CreateRoomRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(256);
        RuleFor(x => x.Password)
            .MaximumLength(128)
            .When(x => x.Password is not null);
    }
}
