import { AnimatePresence, MotionConfig } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { GoalPage } from "./components/GoalPage";
import { ImportPresetScreen } from "./components/ImportPresetScreen";
import { MainMenu } from "./components/MainMenu";
import { ProgressView } from "./components/ProgressView";
import { installLayoutDiagnostics } from "./lib/layoutDiagnostics";
import {
  AppState,
  ProgressBarStyleId,
  ProgressList,
  STORAGE_KEY,
  THEME_KEY,
  Theme,
  addProgressItem,
  applyScheduledCompletions,
  buildInitialState,
  createPresetProgressList,
  deleteProgressItem,
  deleteProgressListFromState,
  parseState,
  renameProgressItem,
  resolveSelectedList,
  serializeState,
  setProgressBarStyle,
  setProgressItemSchedule,
  toggleProgressItem,
  type PresetId
} from "./lib/progress";

type View = "menu" | "progress" | "import";

type BootState = {
  state: AppState;
  view: View;
};

export default function App() {
  useEffect(() => {
    installLayoutDiagnostics();
  }, []);

  const [boot] = useState<BootState>(() => {
    const state = loadAppState();

    const importRoute = window.location.pathname.startsWith("/p/") || window.location.pathname === "/import";

    return {
      state,
      view: importRoute ? "import" : state.progressLists.length > 0 ? "progress" : "menu"
    };
  });
  const [state, setState] = useState<AppState>(boot.state);
  const [view, setView] = useState<View>(boot.view);
  const selectedList = useMemo(() => resolveSelectedList(state), [state]);
  const isGoalRoute = window.location.pathname === "/goal";

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.style.colorScheme = state.theme;
  }, [state.theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, serializeState(state));
    localStorage.setItem(THEME_KEY, state.theme);
  }, [state]);

  useEffect(() => {
    const checkSchedules = () => {
      setState((current) => applyScheduledCompletions(current));
    };

    checkSchedules();
    const intervalId = window.setInterval(checkSchedules, 45_000);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSchedules();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  function setTheme(theme: Theme) {
    setState((current) => ({ ...current, theme }));
  }

  function addProgressList(list: ProgressList) {
    setState((current) => ({
      ...current,
      progressLists: [list, ...current.progressLists],
      selectedProgressId: list.id
    }));
    setView("progress");
  }

  function importProgressList(list: ProgressList) {
    window.history.replaceState(null, "", "/");
    addProgressList(list);
  }

  function addPreset(presetId: PresetId) {
    addProgressList(createPresetProgressList(presetId));
  }

  function selectProgressList(listId: string) {
    setState((current) => ({ ...current, selectedProgressId: listId }));
    setView("progress");
  }

  function updateList(listId: string, update: (list: ProgressList) => ProgressList) {
    setState((current) => ({
      ...current,
      progressLists: current.progressLists.map((list) =>
        list.id === listId ? update(list) : list
      )
    }));
  }

  function toggleItem(listId: string, itemId: string) {
    updateList(listId, (list) => toggleProgressItem(list, itemId));
  }

  function renameItem(listId: string, itemId: string, label: string) {
    updateList(listId, (list) => renameProgressItem(list, itemId, label));
  }

  function removeItem(listId: string, itemId: string) {
    updateList(listId, (list) => deleteProgressItem(list, itemId));
  }

  function addItem(listId: string) {
    updateList(listId, (list) => addProgressItem(list));
  }

  function scheduleItem(
    listId: string,
    itemId: string,
    autoCompleteAt: string | null
  ) {
    setState((current) =>
      applyScheduledCompletions({
        ...current,
        progressLists: current.progressLists.map((list) =>
          list.id === listId
            ? setProgressItemSchedule(list, itemId, autoCompleteAt)
            : list
        )
      })
    );
  }

  function changeBarStyle(listId: string, barStyle: ProgressBarStyleId) {
    updateList(listId, (list) => setProgressBarStyle(list, barStyle));
  }

  function deleteList(listId: string) {
    setState((current) => {
      const next = deleteProgressListFromState(current, listId);

      if (next.progressLists.length === 0) {
        window.setTimeout(() => setView("menu"), 0);
      }

      return next;
    });
  }

  function resetProgress() {
    setState((current) => buildInitialState(current.theme));
    setView("menu");
  }

  if (isGoalRoute) {
    return <GoalPage state={state} />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {view === "menu" && (
          <MainMenu
            key="menu"
            progressCount={state.progressLists.length}
            theme={state.theme}
            onCreate={addProgressList}
            onPreset={addPreset}
            onImport={() => setView("import")}
            onReset={resetProgress}
            onResume={() => setView("progress")}
            onThemeChange={setTheme}
          />
        )}
        {view === "import" && (
          <ImportPresetScreen
            key="import"
            mode={window.location.pathname.startsWith("/p/") || window.location.pathname === "/import" ? "route" : "manual"}
            theme={state.theme}
            onBack={() => {
              window.history.replaceState(null, "", "/");
              setView(state.progressLists.length > 0 ? "progress" : "menu");
            }}
            onImport={importProgressList}
            onThemeChange={setTheme}
          />
        )}
        {view === "progress" && selectedList && (
          <ProgressView
            key="progress"
            lists={state.progressLists}
            selectedList={selectedList}
            onAddItem={addItem}
            onChangeBarStyle={changeBarStyle}
            onDeleteItem={removeItem}
            onDeleteList={deleteList}
            onMainMenu={() => setView("menu")}
            onRenameItem={renameItem}
            onScheduleItem={scheduleItem}
            onSelectList={selectProgressList}
            onToggleItem={toggleItem}
          />
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

function loadAppState(): AppState {
  const theme = loadTheme();
  return parseState(localStorage.getItem(STORAGE_KEY), theme);
}

function loadTheme(): Theme {
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
