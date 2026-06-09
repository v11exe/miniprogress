import { motion } from "framer-motion";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { pageTransition, spring } from "../lib/motion";
import {
  buildImportPreview,
  createImportedList,
  decodeShareText,
  parseImportHash,
  readPresetFile,
  validateSharedPreset,
  type ImportPreview,
  type SharedPreset
} from "../lib/share";
import type { ProgressList, Theme } from "../lib/progress";
import { ProgressBar } from "./ProgressBar";
import { TopControls } from "./TopControls";

type ImportPresetScreenProps = {
  mode: "route" | "manual";
  theme: Theme;
  onBack: () => void;
  onImport: (list: ProgressList) => void;
  onThemeChange: (theme: Theme) => void;
};

export function ImportPresetScreen({ mode, theme, onBack, onImport, onThemeChange }: ImportPresetScreenProps) {
  const [preset, setPreset] = useState<SharedPreset | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(mode === "route");
  const preview = useMemo(() => (preset ? buildImportPreview(preset) : null), [preset]);

  useEffect(() => {
    if (mode !== "route") return;

    async function loadRoutePreset() {
      setLoading(true);
      setError("");

      try {
        if (window.location.pathname.startsWith("/p/")) {
          const id = window.location.pathname.split("/").filter(Boolean)[1];
          const response = await fetch(`/api/preset/${encodeURIComponent(id)}`);
          if (!response.ok) throw new Error("missing preset");
          setPreset(validateSharedPreset(await response.json()));
          return;
        }

        const parsed = parseImportHash(window.location.hash);
        if (!parsed) throw new Error("missing preset");
        setPreset(parsed);
      } catch {
        setError("this preset can’t be imported");
      } finally {
        setLoading(false);
      }
    }

    void loadRoutePreset();
  }, [mode]);

  function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      setPreset(decodeShareText(draft));
    } catch {
      setError("this preset can’t be imported");
    }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setPreset(await readPresetFile(file));
    } catch {
      setError("this preset can’t be imported");
    } finally {
      event.target.value = "";
    }
  }

  function confirmImport() {
    if (!preset) return;
    onImport(createImportedList(preset));
  }

  return (
    <motion.main
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="app-shell import-shell"
      exit={{ opacity: 0, y: -10, scale: 0.985 }}
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      transition={pageTransition}
    >
      <TopControls theme={theme} onThemeChange={onThemeChange} />
      <motion.h1 className="brand-title brand-title--progress" layout="position" transition={spring}>miniprogress</motion.h1>

      <section className="import-panel">
        {loading ? (
          <p className="share-status">loading preset…</p>
        ) : preview ? (
          <ImportPreviewPanel preview={preview} onBack={onBack} onImport={confirmImport} />
        ) : (
          <form className="manual-import" onSubmit={submitCode}>
            <p className="section-label">import</p>
            <h2>import preset?</h2>
            <textarea
              aria-label="paste share code or link"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="paste code or link…"
              value={draft}
            />
            <label className="file-import-button">
              import file
              <input accept="application/json,.json,.miniprogress" onChange={importFile} type="file" />
            </label>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button className="secondary-button" onClick={onBack} type="button">main menu</button>
              <button className="primary-button" type="submit">preview</button>
            </div>
          </form>
        )}
      </section>
    </motion.main>
  );
}

function ImportPreviewPanel({ preview, onBack, onImport }: { preview: ImportPreview; onBack: () => void; onImport: () => void }) {
  const visibleItems = preview.preset.items.slice(0, 5);
  const moreCount = preview.preset.items.length - visibleItems.length;

  return (
    <div className="import-preview">
      <p className="section-label">import</p>
      <h2>import preset?</h2>
      <div className="preset-preview preset-preview--import">
        <span className="preset-preview__icon">{preview.preset.icon}</span>
        <div>
          <strong>{preview.preset.name}</strong>
          <span>{preview.totalGoals} goals</span>
          {preview.alreadyComplete > 0 && <span>{preview.alreadyComplete} already complete</span>}
          {preview.scheduled > 0 && <span>{preview.scheduled} scheduled</span>}
        </div>
        <ProgressBar animated={false} percent={preview.previewPercent} preview showNumber={false} size="small" styleId={preview.preset.barStyle} />
      </div>
      <div className="import-items">
        {visibleItems.map((item) => <span key={item.label}>{item.label}</span>)}
        {moreCount > 0 && <strong>+ {moreCount} more</strong>}
      </div>
      <div className="form-actions">
        <button className="secondary-button" onClick={onBack} type="button">cancel</button>
        <button className="primary-button" onClick={onImport} type="button">import</button>
      </div>
    </div>
  );
}
