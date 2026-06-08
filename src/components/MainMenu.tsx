import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, KeyboardEvent, useState } from "react";
import {
  gentleSpring,
  pageTransition,
  rowContainer,
  rowItem,
  spring
} from "../lib/motion";
import {
  ProgressBarStyleId,
  ProgressList,
  createProgressList,
  normalizeLabel,
  presetOptions,
  type PresetId,
  type Theme
} from "../lib/progress";
import { ProgressBar } from "./ProgressBar";
import { ProgressBarPicker } from "./ProgressBarPicker";
import { RowButton } from "./RowButton";
import { TopControls } from "./TopControls";

type MainMenuProps = {
  progressCount: number;
  theme: Theme;
  onCreate: (list: ProgressList) => void;
  onPreset: (presetId: PresetId) => void;
  onReset: () => void;
  onResume: () => void;
  onThemeChange: (theme: Theme) => void;
};

export function MainMenu({
  progressCount,
  theme,
  onCreate,
  onPreset,
  onReset,
  onResume,
  onThemeChange
}: MainMenuProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [barPickerOpen, setBarPickerOpen] = useState(false);
  const [barStyle, setBarStyle] = useState<ProgressBarStyleId>("soft-pill");
  const [createOpen, setCreateOpen] = useState(false);
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
        itemLabels: items,
        barStyle
      })
    );
  }

  return (
    <motion.main
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="app-shell menu-shell"
      exit={{ opacity: 0, y: -10, scale: 0.985 }}
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      transition={pageTransition}
    >
      <TopControls theme={theme} onThemeChange={onThemeChange} />

      <motion.h1 className="brand-title" layout="position" transition={spring}>
        miniprogress
      </motion.h1>

      <motion.section
        className={`menu-panel ${createOpen ? "is-creating" : ""}`}
        layout
        transition={spring}
      >
        <AnimatePresence initial={false}>
          {!createOpen && (
            <motion.div
              animate="visible"
              className="menu-section"
              exit={{ opacity: 0, y: -20, scale: 0.975 }}
              initial="hidden"
              key="presets"
              variants={rowContainer}
            >
              <p className="section-label">choose preset</p>
              {presetOptions.map((preset) => (
                <motion.div key={preset.id} variants={rowItem}>
                  <RowButton
                    icon={preset.icon}
                    meta="preset"
                    onClick={() => onPreset(preset.id)}
                    title={preset.name}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form className="menu-section menu-section--create" layout onSubmit={submit}>
          <motion.p className="section-label" layout>
            {createOpen ? "create your own…" : "or make your own"}
          </motion.p>

          <motion.div className="create-row-shell" layout transition={spring}>
            {!createOpen ? (
              <RowButton
                className="row-button--primary"
                meta="blank"
                onClick={() => setCreateOpen(true)}
                title="create your own…"
              />
            ) : (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="create-fields"
                initial={{ opacity: 0, y: 12 }}
                transition={{ ...gentleSpring, delay: 0.1 }}
              >
                <div className="create-panel__header">
                  <p className="section-label">details</p>
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

                <div className="bar-select-wrap">
                  <button
                    className="bar-select-button"
                    onClick={() => setBarPickerOpen((open) => !open)}
                    type="button"
                  >
                    <span>progress bar</span>
                    <ProgressBar
                      animated={false}
                      percent={64}
                      preview
                      showNumber={false}
                      size="small"
                      styleId={barStyle}
                    />
                  </button>
                  <ProgressBarPicker
                    onClose={() => setBarPickerOpen(false)}
                    onSelect={setBarStyle}
                    open={barPickerOpen}
                    selectedStyle={barStyle}
                  />
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
                            setItems((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index)
                            )
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
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setCreateOpen(false);
                      setError("");
                    }}
                    type="button"
                  >
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
              </motion.div>
            )}
          </motion.div>
        </motion.form>

        {!createOpen && progressCount > 0 && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="menu-section menu-section--saved"
            initial={{ opacity: 0, y: 8 }}
            layout
          >
            <RowButton meta={`${progressCount} saved`} onClick={onResume} title="view progress" />
            <button className="text-control" onClick={onReset} type="button">
              reset progress
            </button>
          </motion.div>
        )}
      </motion.section>

      <p className="credit">developed by rayaan omair</p>
    </motion.main>
  );
}
