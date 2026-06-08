import { AnimatePresence, motion } from "framer-motion";
import { spring } from "../lib/motion";
import type { ProgressItem } from "../lib/progress";

type ChecklistItemProps = {
  item: ProgressItem;
  onToggle: () => void;
};

export function ChecklistItem({ item, onToggle }: ChecklistItemProps) {
  return (
    <motion.button
      aria-checked={item.completed}
      className={`checklist-item ${item.completed ? "is-complete" : ""}`}
      onClick={onToggle}
      role="checkbox"
      type="button"
      whileTap={{ scale: 0.982 }}
      transition={spring}
    >
      <motion.span
        animate={{ scale: item.completed ? [1, 0.86, 1.06, 1] : 1 }}
        className="checklist-item__box"
        transition={{ duration: 0.34, ease: "easeOut" }}
      >
        <AnimatePresence initial={false}>
          {item.completed && (
            <motion.span
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="checklist-item__tick"
              exit={{ opacity: 0, scale: 0.52, y: -2 }}
              initial={{ opacity: 0, scale: 0.42, y: 3 }}
              transition={{ ...spring, duration: 0.28 }}
            >
              ✓
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
      <span className="checklist-item__label">{item.label}</span>
    </motion.button>
  );
}
