using FluentValidation;
using SMTools.Notes.DTOs;

namespace SMTools.Notes.Validation;

public sealed class CreateNoteRequestValidator : AbstractValidator<CreateNoteRequest>
{
    public CreateNoteRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(256);

        RuleFor(x => x.Content)
            .MaximumLength(10000)
            .When(x => !string.IsNullOrEmpty(x.Content));
    }
}
