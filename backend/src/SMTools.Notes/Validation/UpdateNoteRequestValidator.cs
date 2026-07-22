using FluentValidation;
using SMTools.Notes.DTOs;

namespace SMTools.Notes.Validation;

public sealed class UpdateNoteRequestValidator : AbstractValidator<UpdateNoteRequest>
{
    public UpdateNoteRequestValidator()
    {
        When(x => x.Title is not null, () =>
        {
            RuleFor(x => x.Title!)
                .NotEmpty()
                .MaximumLength(256);
        });

        When(x => x.Content is not null, () =>
        {
            RuleFor(x => x.Content!)
                .MaximumLength(10000);
        });
    }
}
