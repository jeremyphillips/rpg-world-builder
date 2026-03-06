/**
 * Content change validation (delete/disallow).
 *
 * Validates whether content can be deleted or disabled based on
 * character references in the campaign.
 */
export {
  validateCharacterReferenceChange,
  type ChangeValidationResult,
  type CharacterReferenceMode,
  type CharacterReferenceLike,
  type CharacterReferenceMatcher,
} from './validateCharacterReferenceChange';
export { buildBlockedMessage, type ValidationMode } from './validationMessage';
