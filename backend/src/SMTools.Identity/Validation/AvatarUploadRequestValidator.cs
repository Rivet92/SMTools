using FluentValidation;
using SMTools.Identity.DTOs;

namespace SMTools.Identity.Validation;

public sealed class AvatarUploadRequestValidator : AbstractValidator<AvatarUploadRequest>
{
    public AvatarUploadRequestValidator()
    {
        RuleFor(x => x.File)
            .NotNull().WithMessage("No file was provided.")
            .DependentRules(() =>
            {
                RuleFor(x => x.File.Length)
                    .GreaterThan(0).WithMessage("File is empty.")
                    .LessThanOrEqualTo(2 * 1024 * 1024).WithMessage("Avatar must be 2 MB or less.");

                RuleFor(x => x.File.FileName)
                    .Must(name =>
                    {
                        var ext = Path.GetExtension(name).ToLowerInvariant();
                        return ext is ".jpg" or ".jpeg" or ".png";
                    }).WithMessage("Only JPG and PNG files are allowed.");
            });
    }
}
