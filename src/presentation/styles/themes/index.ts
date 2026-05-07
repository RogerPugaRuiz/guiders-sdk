/**
 * GCS Theme Registry
 *
 * Central map of all built-in themes.
 * To add a new theme:
 *   1. Create src/presentation/styles/themes/my-theme.theme.ts
 *   2. Import it here and add it to THEME_REGISTRY.
 *   3. Add its id to BuiltInThemeId in theme-types.ts (optional but recommended).
 */
import { ThemeDefinition, ThemeId } from './theme-types';
import { defaultTheme } from './default.theme';
import { carbonTheme } from './carbon.theme';

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
    [defaultTheme.id]: defaultTheme,
    [carbonTheme.id]:  carbonTheme,
};

/**
 * Resolve a theme by id.
 * Falls back to 'default' if the id is unknown.
 */
export function resolveTheme(id?: ThemeId): ThemeDefinition {
    if (!id) return defaultTheme;
    return THEME_REGISTRY[id] ?? defaultTheme;
}

export { defaultTheme, carbonTheme };
export type { ThemeDefinition, ThemeId, BuiltInThemeId } from './theme-types';
