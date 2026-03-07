// Campaign-owned equipment items are editable. System items are edited via patching.
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { ConditionalFormRenderer } from '@/ui/patterns';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/shared/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { useAccessPolicyField } from '@/features/content/shared/hooks/useAccessPolicyField';
import { useCreateEntrySubmit } from '@/features/content/shared/hooks/useCreateEntrySubmit';
import type { ValidationError } from '@/features/content/shared/hooks/editRoute.types';
import { weaponRepo } from '@/features/content/domain/repo';
import {
  type WeaponFormValues,
  getWeaponFieldConfigs,
  WEAPON_FORM_DEFAULTS,
  toWeaponInput,
} from '@/features/content/equipment/weapons/domain';

const FORM_ID = 'weapon-create-form';

export default function WeaponCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const methods = useForm<WeaponFormValues>({
    defaultValues: WEAPON_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { setValue, watch, formState: { isDirty } } = methods;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const { policyValue, handlePolicyChange } =
    useAccessPolicyField<WeaponFormValues>(watch, setValue);

  const handleSubmit = useCreateEntrySubmit<
    WeaponFormValues,
    Parameters<typeof weaponRepo.createEntry>[1],
    Awaited<ReturnType<typeof weaponRepo.createEntry>>
  >({
    campaignId,
    navigate,
    createEntry: weaponRepo.createEntry,
    toInput: toWeaponInput,
    getSuccessPath: (cid, created) =>
      `/campaigns/${cid}/world/equipment/weapons/${created.id}`,
    setSaving,
    setErrors,
  });

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/equipment/weapons`);
  }, [navigate, campaignId]);

  const fieldConfigs = getWeaponFieldConfigs({ policyCharacters });

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Weapon"
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
