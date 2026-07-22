using FluentValidation;
using SMTools.Identity.DTOs;

namespace SMTools.Identity.Validation;

public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => x.Name is not null || x.AvatarUrl is not null)
            .WithMessage("At least one of Name or AvatarUrl must be provided.");

        When(x => x.Name is not null, () =>
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .MaximumLength(100);
        });

        When(x => x.AvatarUrl is not null, () =>
        {
            RuleFor(x => x.AvatarUrl)
                .NotEmpty();
        });
    }
}
