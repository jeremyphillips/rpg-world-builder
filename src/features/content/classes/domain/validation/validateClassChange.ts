/**
 * Class change validator.
 *
 * Used to block destructive changes (delete or disable) when
 * the class is referenced by active campaign entities.
 *
 * Accounts for multiclass: a character uses a class if any of
 * their classes has that classId.
 *
 * Future extensions:
 * - NPC validation
 * - campaign encounter validation
 */
import {
  validateCharacterReferenceChange,
  type ChangeValidationResult,
} from '@/features/content/shared/domain/validation/validateCharacterReferenceChange';

export type ClassValidationMode = 'delete' | 'disallow';

type CharacterWithClasses = { _id: string; name: string; classes?: { classId: string }[] };

/**
 * Validates whether a class can be deleted or disabled.
 *
 * Checks characters in the campaign. Accounts for multiclass:
 * a character uses the class if any of their classes has that classId.
 *
 * TODO: extend to also check NPC usage once NPC class support exists
 */
export async function validateClassChange(params: {
  campaignId: string;
  classId: string;
  mode: ClassValidationMode;
  includeNpcs?: boolean;
}): Promise<ChangeValidationResult> {
  const { campaignId, classId, mode, includeNpcs } = params;

  return validateCharacterReferenceChange<CharacterWithClasses>({
    campaignId,
    mode,
    includeNpcs,
    contentType: 'class',
    matcher: (c) => c.classes?.some((cls) => cls.classId === classId) ?? false,
  });
}
