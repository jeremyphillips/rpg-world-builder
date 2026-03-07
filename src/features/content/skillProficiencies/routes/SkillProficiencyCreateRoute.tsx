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
  skillProficiencyRepo,
  type SkillProficiencyFormValues,
  getSkillProficiencyFieldConfigs,
  SKILL_PROFICIENCY_FORM_DEFAULTS,
  toSkillProficiencyInput,
} from '@/features/content/skillProficiencies/domain';
import { ConditionalFormRenderer } from '@/ui/patterns';

const FORM_ID = 'skill-proficiency-create-form';

export default function SkillProficiencyCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const methods = useForm<SkillProficiencyFormValues>({
    defaultValues: SKILL_PROFICIENCY_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { setValue, watch, formState: { isDirty } } = methods;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const { policyValue, handlePolicyChange } =
    useAccessPolicyField<SkillProficiencyFormValues>(watch, setValue);

  const handleSubmit = useCreateEntrySubmit<
    SkillProficiencyFormValues,
    Parameters<typeof skillProficiencyRepo.createEntry>[1],
    Awaited<ReturnType<typeof skillProficiencyRepo.createEntry>>
  >({
    campaignId,
    navigate,
    createEntry: skillProficiencyRepo.createEntry,
    toInput: toSkillProficiencyInput,
    getSuccessPath: (cid, created) =>
      `/campaigns/${cid}/world/skill-proficiencies/${created.id}`,
    setSaving,
    setErrors,
  });

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/skill-proficiencies`);
  }, [navigate, campaignId]);

  const fieldConfigs = getSkillProficiencyFieldConfigs({ policyCharacters });

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Skill Proficiency"
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
        <form
          id={FORM_ID}
          onSubmit={methods.handleSubmit(handleSubmit)}
          noValidate
        >
          <ConditionalFormRenderer fields={fieldConfigs} />
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
