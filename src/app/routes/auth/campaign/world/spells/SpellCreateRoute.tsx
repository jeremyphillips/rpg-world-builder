import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { ConditionalFormRenderer } from '@/ui/patterns';
import type { Visibility } from '@/shared/types/visibility';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/shared/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { spellRepo } from '@/features/content/domain/repo';
import type { SpellInput } from '@/features/content/shared/domain/types/spell.types';
import {
  type SpellFormValues,
  getSpellFieldConfigs,
  SPELL_FORM_DEFAULTS,
  toSpellInput,
} from '@/features/spell/forms';

type ValidationError = { path: string; code: string; message: string };

const FORM_ID = 'spell-create-form';

export default function SpellCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const methods = useForm<SpellFormValues>({
    defaultValues: SPELL_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { setValue, watch, formState: { isDirty } } = methods;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const policyValue = watch('accessPolicy');
  const handlePolicyChange = useCallback(
    (next: Visibility) => {
      setValue('accessPolicy', next, { shouldDirty: true });
    },
    [setValue],
  );

  const handleSubmit = useCallback(
    async (values: SpellFormValues) => {
      if (!campaignId) return;
      setSaving(true);
      setErrors([]);

      const input: SpellInput = toSpellInput(values);

      try {
        const created = await spellRepo.createEntry(campaignId, input);
        navigate(`/campaigns/${campaignId}/world/spells/${created.id}`, {
          replace: true,
        });
      } catch (err) {
        setErrors([
          { path: '', code: 'SAVE_FAILED', message: (err as Error).message },
        ]);
      } finally {
        setSaving(false);
      }
    },
    [campaignId, navigate],
  );

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/spells`);
  }, [navigate, campaignId]);

  const fieldConfigs = getSpellFieldConfigs({ policyCharacters });

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Spell"
        isNew
        saving={saving}
        dirty={isDirty}
        success={false}
        errors={errors}
        formId={FORM_ID}
        onBack={handleBack}
        showPolicyField
        policyValue={policyValue}
        onPolicyChange={handlePolicyChange}
        policyCharacters={policyCharacters}
      >
        <form id={FORM_ID} onSubmit={methods.handleSubmit(handleSubmit)} noValidate>
          <ConditionalFormRenderer fields={fieldConfigs} />
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
