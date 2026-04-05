# Location forms (`domain/forms/`)

Ownership for the location create/edit form layer (metadata, grid bootstrap fields, building fields).

| Folder | Owns |
|--------|------|
| `config/` | Field config defaults and `getLocationFieldConfigs` |
| `mappers/` | `locationToFormValues`, `toLocationInput`, and other entity ↔ form projections |
| `registry/` | `LOCATION_FORM_FIELDS` and ConditionalFormRenderer wiring |
| `types/` | `LocationFormValues` and form-specific TypeScript types |
| `rules/` | Sanitize, validation, UI policy, dependent-field rules, parent/building picker option helpers that encode policy |
| `setup/` | Create-flow helpers (`locationCreateSetupForm`) and setup-only utilities (`locationEntityRefPicker`) |

Public exports remain through `forms/index.ts` and the locations `domain` barrel.
