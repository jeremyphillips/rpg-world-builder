import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import type { Visibility } from '@/shared/types/visibility';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { skillProficiencyRepo } from '@/features/content/domain/repo';
import type { SkillProficiencyInput } from '@/features/content/domain/types';
import {
  type SkillProficiencyFormValues,
  getSkillProficiencyFieldConfigs,
  SKILL_PROFICIENCY_FORM_DEFAULTS,
  toSkillProficiencyInput,
} from '@/features/skillProficiency/forms';
import { ConditionalFormRenderer } from '@/ui/patterns';

type ValidationError = { path: string; code: string; message: string };

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

  const policyValue = watch('accessPolicy');
  const handlePolicyChange = useCallback(
    (next: Visibility) => {
      setValue('accessPolicy', next, { shouldDirty: true });
    },
    [setValue],
  );

  const handleSubmit = useCallback(
    async (values: SkillProficiencyFormValues) => {
      if (!campaignId) return;
      setSaving(true);
      setErrors([]);

      const input: SkillProficiencyInput = toSkillProficiencyInput(values);

      try {
        const created = await skillProficiencyRepo.createEntry(campaignId, input);
        navigate(
          `/campaigns/${campaignId}/world/skill-proficiencies/${created.id}`,
          { replace: true },
        );
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
