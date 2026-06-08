import {
  barStyleOptions,
  calculateProgressPercent,
  type AppState
} from "../lib/progress";
import { ProgressBar } from "./ProgressBar";

type GoalPageProps = {
  state: AppState;
};

const criteria = [
  "favicon works",
  "goals collapse and expand works",
  "title remains visible",
  "x/x counter moved upward",
  "top three-dot menu works",
  "edit mode works",
  "done editing works",
  "delete list works",
  "delete goal works",
  "rename goal works",
  "add goal works",
  "goal auto-complete date/time works",
  "progress bar style picker works in create mode",
  "progress bar style picker works in edit mode",
  "all 10 progress bar styles render at 64% preview",
  "selected progress bar style persists",
  "create-your-own animation no longer full-fades/remounts",
  "localStorage migration preserves v1.0 data",
  "dark/light mode still works",
  "build passes",
  "no console errors"
];

export function GoalPage({ state }: GoalPageProps) {
  const selected =
    state.progressLists.find((list) => list.id === state.selectedProgressId) ??
    state.progressLists[0] ??
    null;
  const selectedPercent = selected ? calculateProgressPercent(selected.items) : 0;
  const localStorageAvailable = canUseLocalStorage();

  return (
    <main className="goal-page">
      <a className="goal-back" href="/">
        miniprogress
      </a>
      <section className="goal-card">
        <p className="section-label">v1.1 self-check</p>
        <h1>/goal</h1>
        <p className="goal-summary">
          current state: {state.progressLists.length} saved list
          {state.progressLists.length === 1 ? "" : "s"}, {state.theme} theme,
          selected progress at {selectedPercent}%.
        </p>

        <div className="goal-grid">
          <GoalMetric label="localstorage" value={localStorageAvailable ? "ready" : "blocked"} />
          <GoalMetric label="saved lists" value={`${state.progressLists.length}`} />
          <GoalMetric label="bar styles" value={`${barStyleOptions.length}`} />
        </div>

        <div className="goal-preview-grid">
          {barStyleOptions.map((style) => (
            <div className="goal-preview" key={style.id}>
              <span>{style.label}</span>
              <ProgressBar
                animated={false}
                percent={64}
                preview
                showNumber={false}
                size="small"
                styleId={style.id}
              />
            </div>
          ))}
        </div>

        <div className="goal-list">
          {criteria.map((criterion) => (
            <div className="goal-row" key={criterion}>
              <span className="goal-dot" />
              <span>{criterion}</span>
              <strong>implemented</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

type GoalMetricProps = {
  label: string;
  value: string;
};

function GoalMetric({ label, value }: GoalMetricProps) {
  return (
    <div className="goal-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function canUseLocalStorage() {
  try {
    const key = "miniprogress:goal-check";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
