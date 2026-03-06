/**
 * Shared message template for content change validation (delete/disallow).
 *
 * Used when blocking destructive changes because the content is
 * referenced by campaign characters.
 */

const MAX_NAMES_SHOWN = 5;

type BlockingEntityLike = { id: string; label: string; to?: string };

export type ValidationMode = 'delete' | 'disallow';

export function buildBlockedMessage(params: {
  contentType: string;
  mode: ValidationMode;
  blockingEntities: BlockingEntityLike[];
}): string {
  const { contentType, mode, blockingEntities } = params;
  const count = blockingEntities.length;
  const noun = count === 1 ? 'character' : 'characters';

  const names = blockingEntities.map((b) => b.label);
  const displayNames = names.slice(0, MAX_NAMES_SHOWN);
  const remaining = count - MAX_NAMES_SHOWN;

  const header = `This ${contentType} is currently used by:`;
  const nameLines = displayNames.join('\n');
  const moreLine = remaining > 0 ? `and ${remaining} more` : '';
  const body = moreLine ? `${nameLines}\n${moreLine}` : nameLines;
  const footer =
    mode === 'delete'
      ? `Remove the ${contentType} from those ${noun} before deleting.`
      : `Remove the ${contentType} from those ${noun} before disabling it for the campaign.`;

  return `${header}\n${body}\n\n${footer}`;
}
