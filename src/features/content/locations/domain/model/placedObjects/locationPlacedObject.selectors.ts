/**
 * Placed-object selectors: {@link ./locationPlacedObject.selectors.core} (Node-safe) +
 * {@link ./locationPlacedObject.selectors.ui} (Vite raster URLs). Server code should import **core** only
 * when it must not load `import.meta.glob`.
 */
export * from './locationPlacedObject.selectors.core';
export * from './locationPlacedObject.selectors.ui';
