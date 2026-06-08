import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { gentleSpring } from "../lib/motion";
import {
  ProgressBarStyleId,
  barStyleOptions
} from "../lib/progress";
import { ProgressBar } from "./ProgressBar";

type ProgressBarPickerProps = {
  onClose: () => void;
  onSelect: (styleId: ProgressBarStyleId) => void;
  open: boolean;
  selectedStyle: ProgressBarStyleId;
};

export function ProgressBarPicker({
  onClose,
  onSelect,
  open,
  selectedStyle
}: ProgressBarPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="picker-popover"
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          initial={{ opacity: 0, y: 7, scale: 0.97 }}
          ref={panelRef}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <p className="picker-popover__label">bar style</p>
          <div className="picker-popover__list">
            {barStyleOptions.map((style) => (
              <motion.button
                className={`bar-style-option ${
                  style.id === selectedStyle ? "is-selected" : ""
                }`}
                key={style.id}
                onClick={() => {
                  onSelect(style.id);
                  onClose();
                }}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={gentleSpring}
              >
                <span>{style.label}</span>
                <ProgressBar
                  animated={false}
                  percent={64}
                  preview
                  showNumber={false}
                  size="small"
                  styleId={style.id}
                />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
