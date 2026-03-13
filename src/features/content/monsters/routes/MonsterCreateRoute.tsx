/**
 * Campaign-owned monsters are created here. System monsters are not created via UI.
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/shared/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { useAccessPolicyField } from '@/features/content/shared/hooks/useAccessPolicyField';
import { useCreateEntrySubmit } from '@/features/content/shared/hooks/useCreateEntrySubmit';
import type { ValidationError } from '@/features/content/shared/hooks/editRoute.types';
import {
  monsterRepo,
  type MonsterFormValues,
  getMonsterFieldConfigs,
  MONSTER_FORM_DEFAULTS,
  toMonsterInput,
} from '@/features/content/monsters/domain';
import { ConditionalFormRenderer } from '@/ui/patterns';

const FORM_ID = 'monster-create-form';

export default function MonsterCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const methods = useForm<MonsterFormValues>({
    defaultValues: MONSTER_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { setValue, watch, formState: { isDirty } } = methods;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const { policyValue, handlePolicyChange } =
    useAccessPolicyField<MonsterFormValues>(watch, setValue);

  const handleSubmit = useCreateEntrySubmit<
    MonsterFormValues,
    Parameters<typeof monsterRepo.createEntry>[1],
    Awaited<ReturnType<typeof monsterRepo.createEntry>>
  >({
    campaignId,
    navigate,
    createEntry: monsterRepo.createEntry,
    toInput: toMonsterInput,
    getSuccessPath: (cid, created) =>
      `/campaigns/${cid}/world/monsters/${created.id}`,
    setSaving,
    setErrors,
  });

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/monsters`);
  }, [navigate, campaignId]);

  const fieldConfigs = getMonsterFieldConfigs({ policyCharacters });

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Monster"
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
