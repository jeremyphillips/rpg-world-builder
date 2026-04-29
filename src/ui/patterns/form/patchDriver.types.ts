export type PatchDriver = {
  getValue(path: string): unknown;
  setValue(path: string, value: unknown): void;
  unsetValue?(path: string): void;
};
