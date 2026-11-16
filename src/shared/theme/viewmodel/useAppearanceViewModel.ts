import { DEFAULT_THEME_ID } from '../model/registry';
import { useTheme } from './ThemeProvider';

export function useAppearanceViewModel() {
  const {themeId,themes,setTheme,resetTheme,persistenceError}=useTheme();
  return {
    options:themes.map(theme=>({id:theme.id,name:theme.name,description:theme.description,modeLabel:theme.mode==='light'?'Light':'Dark',isDefault:theme.id===DEFAULT_THEME_ID,selected:theme.id===themeId,
      colors:[theme.colors.canvas,theme.colors.surface,theme.colors.accent,theme.colors.secondary],
      preview:{backgroundColor:theme.colors.canvas,color:theme.colors.textPrimary,borderColor:theme.colors.divider},
      panelColor:theme.colors.surface,accent:theme.colors.accent,secondary:theme.colors.secondary,textColor:theme.colors.textSecondary})),
    selectTheme:setTheme,resetTheme,persistenceError,
  };
}
export type AppearancePresentation = ReturnType<typeof useAppearanceViewModel>;
