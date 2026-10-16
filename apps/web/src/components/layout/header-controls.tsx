import { LanguageSwitch } from './language-switch';
import { ThemeSwitch } from './theme-switch';

/** Theme and language toggles shown in every page header. */
export function HeaderControls() {
  return (
    <div className="flex items-center gap-2">
      <ThemeSwitch />
      <LanguageSwitch />
    </div>
  );
}
