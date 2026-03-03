export type { WeaponFormValues } from './weaponForm.types';
export {
  getWeaponFieldConfigs,
  WEAPON_FORM_DEFAULTS,
  type GetWeaponFieldConfigsOptions,
} from './weaponForm.config';
export {
  weaponToFormValues,
  toWeaponInput,
  weaponDomainPatchToForm,
  weaponPatchToDomain,
} from './weaponForm.mappers';
export { WEAPON_DETAIL_SPECS, type WeaponDetailCtx } from './weaponDetail.spec';
