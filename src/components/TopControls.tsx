import { ThemeToggle } from "./ThemeToggle";
import type { Theme } from "../lib/progress";

type TopControlsProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

export function TopControls({ theme, onThemeChange }: TopControlsProps) {
  return (
    <div className="top-controls" aria-label="app controls">
      <ThemeToggle theme={theme} onChange={onThemeChange} />
      <span className="version">v1.3</span>
    </div>
  );
}
