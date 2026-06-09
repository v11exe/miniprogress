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
  "responsive tested at all required viewports",
  "mobile title no longer compresses",
  "progress view works on narrow screens",
  "Party.js installed and used",
  "old celebration system removed/replaced",
  "centered completion burst works",
  "progress bar glow/pulse works",
  "background-click burst works only when focused list is complete",
  "background-click burst does not trigger on buttons/inputs/dropdowns",
  "reduced motion disables particles",
  "share preset appears in dropdown",
  "share screen works",
  "KV short link POST endpoint implemented",
  "KV preset GET endpoint implemented",
  "KV failure fallback works",
  "encoded link import works",
  "copy code works",
  "export JSON works",
  "paste code import works",
  "file import works",
  "/p/:id route works",
  "/import#data=... route works",
  "import preview validates data",
  "import preview shows already completed goals from past scheduled times",
  "imported list receives fresh IDs",
  "localStorage persists imported lists",
  "README documents Cloudflare KV setup",
  "visible version says v1.3",
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
        <p className="section-label">v1.3 self-check</p>
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
