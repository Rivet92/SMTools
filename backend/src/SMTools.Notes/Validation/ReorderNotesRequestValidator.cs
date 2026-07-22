using FluentValidation;
using SMTools.Notes.DTOs;

namespace SMTools.Notes.Validation;

public sealed class ReorderNotesRequestValidator : AbstractValidator<ReorderNotesRequest>
{
    public ReorderNotesRequestValidator()
    {
        RuleFor(x => x.Updates)
            .NotEmpty()
            .Must(items => items.Select(i => i.NoteId).Distinct().Count() == items.Count)
            .WithMessage("Each note can only appear once in the reorder request.");

        RuleForEach(x => x.Updates)
            .ChildRules(item =>
            {
                item.RuleFor(i => i.Position)
                    .GreaterThanOrEqualTo(0);
            });
    }
}
