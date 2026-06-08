import { AnimatePresence, motion } from "framer-motion";
import {
  KeyboardEvent,
  useEffect,
  useRef,
  useState
} from "react";
import {
  gentleSpring,
  pageTransition,
  rowContainer,
  rowItem,
  spring
} from "../lib/motion";
import {
  ProgressBarStyleId,
  ProgressItem,
  ProgressList,
  calculateProgressPercent
} from "../lib/progress";
import { ChecklistItem } from "./ChecklistItem";
import { ProgressBar } from "./ProgressBar";
import { ProgressBarPicker } from "./ProgressBarPicker";

type ProgressViewProps = {
  lists: ProgressList[];
  selectedList: ProgressList;
  onAddItem: (listId: string) => void;
  onChangeBarStyle: (listId: string, styleId: ProgressBarStyleId) => void;
  onDeleteItem: (listId: string, itemId: string) => void;
  onDeleteList: (listId: string) => void;
  onMainMenu: () => void;
  onRenameItem: (listId: string, itemId: string, label: string) => void;
  onScheduleItem: (listId: string, itemId: string, autoCompleteAt: string | null) => void;
  onSelectList: (listId: string) => void;
  onToggleItem: (listId: string, itemId: string) => void;
};

export function ProgressView({
  lists,
  selectedList,
  onAddItem,
  onChangeBarStyle,
  onDeleteItem,
  onDeleteList,
  onMainMenu,
  onRenameItem,
  onScheduleItem,
  onSelectList,
  onToggleItem
}: ProgressViewProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [barPickerOpen, setBarPickerOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);
  const otherLists = lists.filter((list) => list.id !== selectedList.id);
  const completedCount = selectedList.items.filter((item) => item.completed).length;
  const selectedPercent = calculateProgressPercent(selectedList.items);

  useEffect(() => {
    setActionMenuOpen(false);
    setBarPickerOpen(false);
    setConfirmDeleteOpen(false);
    setEditMode(false);
    setGoalsOpen(false);
  }, [selectedList.id]);

  useEffect(() => {
    if (!actionMenuOpen && !confirmDeleteOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!actionRef.current?.contains(event.target as Node)) {
        setActionMenuOpen(false);
        setConfirmDeleteOpen(false);
      }
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setActionMenuOpen(false);
        setConfirmDeleteOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [actionMenuOpen, confirmDeleteOpen]);

  function startEditing() {
    setEditMode(true);
    setGoalsOpen(true);
    setActionMenuOpen(false);
  }

  return (
    <motion.main
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="app-shell progress-shell"
      exit={{ opacity: 0, y: -10, scale: 0.985 }}
      initial={{ opacity: 0, y: 18, scale: 0.982 }}
      transition={pageTransition}
    >
      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className="brand-title brand-title--progress"
        initial={{ opacity: 0, y: 10 }}
        transition={pageTransition}
      >
        miniprogress
      </motion.h1>

      <motion.section
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`focus-card ${editMode ? "is-editing" : ""}`}
        initial={{ opacity: 0, y: 20, scale: 0.965 }}
        layout
        transition={spring}
      >
        <div className="focus-card__top">
          <motion.span
            animate={{ scale: [0.96, 1.04, 1] }}
            className="focus-card__icon"
            key={selectedList.id}
            transition={{ duration: 0.48 }}
          >
            {selectedList.icon}
          </motion.span>
          <div className="focus-card__title">
            <p className="section-label">current list</p>
            <h2>{selectedList.name}</h2>
          </div>
          <div className="focus-card__actions" ref={actionRef}>
            <span className="focus-card__meta">
              {completedCount}/{selectedList.items.length}
            </span>
            {editMode ? (
              <motion.button
                className="done-editing-button"
                onClick={() => {
                  setEditMode(false);
                  setBarPickerOpen(false);
                }}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
              >
                done editing
              </motion.button>
            ) : (
              <motion.button
                aria-expanded={actionMenuOpen}
                aria-label="list actions"
                className="dots-button"
                onClick={() => {
                  setActionMenuOpen((open) => !open);
                  setConfirmDeleteOpen(false);
                }}
                type="button"
                whileHover={{ y: -1, scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                transition={spring}
              >
                ...
              </motion.button>
            )}

            <AnimatePresence>
              {actionMenuOpen && !editMode && (
                <motion.div
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="tiny-menu"
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  initial={{ opacity: 0, y: 7, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <button onClick={startEditing} type="button">
                    edit
                  </button>
                  <button
                    className="danger-row"
                    onClick={() => setConfirmDeleteOpen(true)}
                    type="button"
                  >
                    delete list
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {confirmDeleteOpen && (
                <motion.div
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="confirm-popover"
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  initial={{ opacity: 0, y: 7, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <span>delete this list?</span>
                  <div>
                    <button
                      onClick={() => setConfirmDeleteOpen(false)}
                      type="button"
                    >
                      cancel
                    </button>
                    <button
                      className="danger-row"
                      onClick={() => onDeleteList(selectedList.id)}
                      type="button"
                    >
                      delete
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="bar-edit-wrap">
          <ProgressBar
            onClick={editMode ? () => setBarPickerOpen((open) => !open) : undefined}
            percent={selectedPercent}
            styleId={selectedList.barStyle}
          />
          <ProgressBarPicker
            onClose={() => setBarPickerOpen(false)}
            onSelect={(styleId) => onChangeBarStyle(selectedList.id, styleId)}
            open={barPickerOpen}
            selectedStyle={selectedList.barStyle}
          />
        </div>

        <button
          aria-expanded={goalsOpen}
          className="goals-toggle"
          onClick={() => setGoalsOpen((open) => !open)}
          type="button"
        >
          <span>goals</span>
          <span>{goalsOpen ? "⌃" : "⌄"}</span>
        </button>

        <AnimatePresence initial={false}>
          {goalsOpen && (
            <motion.div
              animate={{ opacity: 1, height: "auto", y: 0 }}
              className="goals-collapse"
              exit={{ opacity: 0, height: 0, y: -8 }}
              initial={{ opacity: 0, height: 0, y: -8 }}
              transition={gentleSpring}
            >
              <motion.div
                animate="visible"
                className="checklist-panel"
                initial="hidden"
                variants={rowContainer}
              >
                <AnimatePresence initial={false}>
                  {selectedList.items.map((item) => (
                    <motion.div
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      initial={{ opacity: 0, y: 8, height: 0 }}
                      key={item.id}
                      layout
                      variants={rowItem}
                    >
                      {editMode ? (
                        <EditableGoalRow
                          item={item}
                          listId={selectedList.id}
                          onDelete={onDeleteItem}
                          onRename={onRenameItem}
                          onSchedule={onScheduleItem}
                          onToggle={onToggleItem}
                        />
                      ) : (
                        <ChecklistItem
                          item={item}
                          onToggle={() => onToggleItem(selectedList.id, item.id)}
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {editMode && (
                  <motion.button
                    className="add-goal-button"
                    onClick={() => onAddItem(selectedList.id)}
                    type="button"
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    transition={spring}
                  >
                    + add goal
                  </motion.button>
                )}

                {selectedList.items.length === 0 && !editMode && (
                  <p className="empty-goals">no goals yet</p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {otherLists.length > 0 && (
        <motion.section
          animate="visible"
          className="mini-list"
          initial="hidden"
          variants={rowContainer}
        >
          <p className="section-label">other lists</p>
          {otherLists.map((list) => (
            <motion.div key={list.id} variants={rowItem}>
              <ProgressCard list={list} onClick={() => onSelectList(list.id)} />
            </motion.div>
          ))}
        </motion.section>
      )}

      <motion.button
        className="main-menu-button"
        onClick={onMainMenu}
        type="button"
        whileHover={{ y: -1, scale: 1.015 }}
        whileTap={{ scale: 0.975 }}
        transition={spring}
      >
        main menu
      </motion.button>
    </motion.main>
  );
}

type EditableGoalRowProps = {
  item: ProgressItem;
  listId: string;
  onDelete: (listId: string, itemId: string) => void;
  onRename: (listId: string, itemId: string, label: string) => void;
  onSchedule: (listId: string, itemId: string, autoCompleteAt: string | null) => void;
  onToggle: (listId: string, itemId: string) => void;
};

function EditableGoalRow({
  item,
  listId,
  onDelete,
  onRename,
  onSchedule,
  onToggle
}: EditableGoalRowProps) {
  const [draft, setDraft] = useState(item.label);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(item.label);
  }, [item.label]);

  useEffect(() => {
    if (!scheduleOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!scheduleRef.current?.contains(event.target as Node)) {
        setScheduleOpen(false);
      }
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setScheduleOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [scheduleOpen]);

  function saveRename() {
    onRename(listId, item.id, draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }

    if (event.key === "Escape") {
      setDraft(item.label);
      event.currentTarget.blur();
    }
  }

  return (
    <motion.div className="editable-goal-row" layout transition={spring}>
      <button
        aria-checked={item.completed}
        aria-label={`toggle ${item.label}`}
        className={`edit-check ${item.completed ? "is-complete" : ""}`}
        onClick={() => onToggle(listId, item.id)}
        role="checkbox"
        type="button"
      >
        {item.completed ? "✓" : ""}
      </button>
      <input
        aria-label={`rename ${item.label}`}
        onBlur={saveRename}
        onChange={(event) => {
          const value = event.target.value.toLowerCase();
          setDraft(value);

          if (value.trim()) {
            onRename(listId, item.id, value);
          }
        }}
        onKeyDown={handleKeyDown}
        value={draft}
      />
      <div className="goal-row-actions" ref={scheduleRef}>
        <button
          aria-expanded={scheduleOpen}
          aria-label={`schedule ${item.label}`}
          className="small-dots-button"
          onClick={() => setScheduleOpen((open) => !open)}
          type="button"
        >
          ...
        </button>
        <AnimatePresence>
          {scheduleOpen && (
            <motion.div
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="schedule-popover"
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              initial={{ opacity: 0, y: 7, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <p>auto complete</p>
              <input
                aria-label={`auto complete ${item.label}`}
                onChange={(event) =>
                  onSchedule(
                    listId,
                    item.id,
                    event.target.value ? localInputToIso(event.target.value) : null
                  )
                }
                type="datetime-local"
                value={isoToLocalInput(item.autoCompleteAt)}
              />
              <button
                onClick={() => onSchedule(listId, item.id, null)}
                type="button"
              >
                clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <button
        aria-label={`delete ${item.label}`}
        className="trash-button"
        onClick={() => onDelete(listId, item.id)}
        type="button"
      >
        trash
      </button>
    </motion.div>
  );
}

type ProgressCardProps = {
  list: ProgressList;
  onClick: () => void;
};

function ProgressCard({ list, onClick }: ProgressCardProps) {
  const percent = calculateProgressPercent(list.items);

  return (
    <motion.button
      className="progress-card"
      onClick={onClick}
      type="button"
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
    >
      <span className="progress-card__icon">{list.icon}</span>
      <span className="progress-card__name">{list.name}</span>
      <ProgressBar
        delay={0.03}
        percent={percent}
        size="small"
        styleId={list.barStyle}
      />
    </motion.button>
  );
}

function isoToLocalInput(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function localInputToIso(value: string): string {
  return new Date(value).toISOString();
}
