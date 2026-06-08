import { AnimatePresence, motion } from "framer-motion";
import { spring } from "../lib/motion";
import type { Theme } from "../lib/progress";

type ThemeToggleProps = {
  theme: Theme;
  onChange: (theme: Theme) => void;
};

export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      aria-label={`switch to ${isDark ? "light" : "dark"} mode`}
      className="theme-toggle"
      onClick={() => onChange(isDark ? "light" : "dark")}
      type="button"
    >
      <span className="theme-toggle__track-icon">☼</span>
      <span className="theme-toggle__track-icon">☾</span>
      <motion.span
        animate={{ x: isDark ? 28 : 0 }}
        className="theme-toggle__thumb"
        transition={spring}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.72, rotate: isDark ? 30 : -30 }}
            initial={{ opacity: 0, scale: 0.72, rotate: isDark ? -30 : 30 }}
            transition={{ duration: 0.18 }}
          >
            {isDark ? "☾" : "☼"}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
