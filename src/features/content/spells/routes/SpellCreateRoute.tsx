import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { ConditionalFormRenderer } from '@/ui/patterns';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';
import { EntryEditorLayout } from '@/features/content/shared/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { useAccessPolicyField } from '@/features/content/shared/hooks/useAccessPolicyField';
import { useCreateEntrySubmit } from '@/features/content/shared/hooks/useCreateEntrySubmit';
import type { ValidationError } from '@/features/content/shared/hooks/editRoute.types';
import {
  spellRepo,
  type SpellFormValues,
  getSpellFieldConfigs,
  SPELL_FORM_DEFAULTS,
  toSpellInput,
} from '@/features/content/spells/domain';

const FORM_ID = 'spell-create-form';

export default function SpellCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();
  const { catalog } = useCampaignRules();
  const classesById = catalog.classesById;

  const methods = useForm<SpellFormValues>({
    defaultValues: SPELL_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { setValue, watch, formState: { isDirty } } = methods;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const { policyValue, handlePolicyChange } =
    useAccessPolicyField<SpellFormValues>(watch, setValue);

  const toSpellInputBound = useCallback(
    (values: SpellFormValues) => toSpellInput(values, { classesById }),
    [classesById],
  );

  const handleSubmit = useCreateEntrySubmit<
    SpellFormValues,
    Parameters<typeof spellRepo.createEntry>[1],
    Awaited<ReturnType<typeof spellRepo.createEntry>>
  >({
    campaignId,
    navigate,
    createEntry: spellRepo.createEntry,
    toInput: toSpellInputBound,
    getSuccessPath: (cid, created) =>
      `/campaigns/${cid}/world/spells/${created.id}`,
    setSaving,
    setErrors,
  });

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/spells`);
  }, [navigate, campaignId]);

  const fieldConfigs = useMemo(
    () => getSpellFieldConfigs({ policyCharacters, classesById }),
    [policyCharacters, classesById],
  );

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
