import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, KeyboardEvent, useState } from "react";
import { gentleSpring, pageTransition, rowContainer, rowItem, spring } from "../lib/motion";
import {
  ProgressList,
  Theme,
  createProgressList,
  normalizeLabel
} from "../lib/progress";
import { RowButton } from "./RowButton";
import { TopControls } from "./TopControls";

type CreateProgressProps = {
  theme: Theme;
  onBack: () => void;
  onCreate: (list: ProgressList) => void;
  onThemeChange: (theme: Theme) => void;
};

export function CreateProgress({
  theme,
  onBack,
  onCreate,
  onThemeChange
}: CreateProgressProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [error, setError] = useState("");
  const [icon, setIcon] = useState("✦");
  const [itemDraft, setItemDraft] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [name, setName] = useState("");

  function addItem() {
    const label = normalizeLabel(itemDraft);

    if (!label) {
      return;
    }

    setItems((current) => [...current, label]);
    setItemDraft("");
  }

  function handleItemKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addItem();
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!normalizeLabel(name)) {
      setError("name needed");
      return;
    }

    onCreate(
      createProgressList({
        name,
        icon,
        itemLabels: items
      })
    );
  }

  return (
    <motion.main
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="app-shell create-shell"
      exit={{ opacity: 0, y: -12, scale: 0.985 }}
      initial={{ opacity: 0, y: 18, scale: 0.982 }}
      transition={pageTransition}
    >
      <TopControls theme={theme} onThemeChange={onThemeChange} />

      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className="brand-title"
        initial={{ opacity: 0, y: 12 }}
        transition={{ ...pageTransition, delay: 0.02 }}
      >
        miniprogress
      </motion.h1>

      <motion.form
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="create-panel"
        initial={{ opacity: 0, y: 28, scale: 0.94 }}
        onSubmit={submit}
        transition={spring}
      >
        <div className="create-panel__header">
          <p className="section-label">create your own…</p>
          {error && <motion.p className="form-error" layout>{error}</motion.p>}
        </div>

        <div className="field-grid">
          <label className="icon-field">
            <span>icon</span>
            <input
              aria-label="icon"
              maxLength={2}
              onChange={(event) => setIcon(event.target.value)}
              value={icon}
            />
          </label>
          <label className="name-field">
            <span>name</span>
            <input
              aria-label="progress list name"
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder="enter name…"
              value={name}
            />
          </label>
        </div>

        <div className="add-item-row">
          <input
            aria-label="checklist item"
            onChange={(event) => setItemDraft(event.target.value)}
            onKeyDown={handleItemKeyDown}
            placeholder="add item…"
            value={itemDraft}
          />
          <button className="tiny-button" onClick={addItem} type="button">
            add
          </button>
        </div>

        <motion.div
          animate="visible"
          className="item-stack"
          initial="hidden"
          variants={rowContainer}
        >
          <AnimatePresence initial={false}>
            {items.map((item, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0, height: "auto" }}
                className="draft-item"
                exit={{ opacity: 0, y: -6, height: 0 }}
                initial={{ opacity: 0, y: 8, height: 0 }}
                key={`${item}-${index}`}
                layout
                variants={rowItem}
              >
                <span>{item}</span>
                <button
                  aria-label={`remove ${item}`}
                  onClick={() =>
                    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
                  }
                  type="button"
                >
                  remove
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="advanced-block">
          <button
            aria-expanded={advancedOpen}
            className="advanced-toggle"
            onClick={() => setAdvancedOpen((open) => !open)}
            type="button"
          >
            advanced…
          </button>
          <AnimatePresence initial={false}>
            {advancedOpen && (
              <motion.div
                animate={{ opacity: 1, height: "auto", y: 0 }}
                className="advanced-panel"
                exit={{ opacity: 0, height: 0, y: -6 }}
                initial={{ opacity: 0, height: 0, y: -6 }}
                transition={gentleSpring}
              >
                <RowButton meta="later" title="auto-complete mode" />
                <RowButton meta="later" title="optional target date" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="form-actions">
          <button className="secondary-button" onClick={onBack} type="button">
            back
          </button>
          <motion.button
            className="primary-button"
            type="submit"
            whileHover={{ y: -1, scale: 1.015 }}
            whileTap={{ scale: 0.975 }}
            transition={spring}
          >
            create
          </motion.button>
        </div>
      </motion.form>

      <p className="credit">developed by rayaan omair</p>
    </motion.main>
  );
}
