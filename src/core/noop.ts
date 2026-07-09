export const noop = (..._: any[]) => {};

// used e.g. because of https://github.com/withastro/astro/issues/14684 — fixed in
// @astrojs/compiler 3.0.0, but @astrojs/check still bundles the unfixed 2.x line;
// obsolete once the language server ships with compiler >= 3.0.0
export const markAsUsed = (..._: any[]) => {};
