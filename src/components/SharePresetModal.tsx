import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { spring } from "../lib/motion";
import {
  createEncodedImportUrl,
  createShareCode,
  createSharedPreset,
  type SharedPreset
} from "../lib/share";
import type { ProgressList } from "../lib/progress";
import { ProgressBar } from "./ProgressBar";

type SharePresetModalProps = {
  list: ProgressList;
  onClose: () => void;
};

export function SharePresetModal({ list, onClose }: SharePresetModalProps) {
  const preset = useMemo(() => createSharedPreset(list), [list]);
  const fallbackLink = useMemo(() => createEncodedImportUrl(preset), [preset]);
  const shareCode = useMemo(() => createShareCode(preset), [preset]);
  const [shortLink, setShortLink] = useState("");
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  async function createShortLink() {
    setCreating(true);
    setStatus("");

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(preset)
      });

      if (!response.ok) {
        throw new Error("short link unavailable");
      }

      const result = (await response.json()) as { url?: string };
      const url = result.url?.startsWith("http")
        ? result.url
        : `${window.location.origin}${result.url ?? ""}`;

      if (!result.url) {
        throw new Error("short link unavailable");
      }

      setShortLink(url);
      setStatus("short link ready");
      await copyText(url);
    } catch {
      setStatus("short link unavailable");
      setShowFallback(true);
    } finally {
      setCreating(false);
    }
  }

  async function copyFallbackLink() {
    await copyText(fallbackLink);
    setShowFallback(true);
    setStatus("link copied");
  }

  async function copyCode() {
    await copyText(shareCode);
    setStatus("code copied");
  }

  function exportFile() {
    downloadPreset(preset);
    setStatus("file exported");
  }

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      role="presentation"
    >
      <motion.section
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="share-panel"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        transition={spring}
      >
        <div className="share-panel__top">
          <div>
            <p className="section-label">preset</p>
            <h2 id="share-title">share preset</h2>
          </div>
          <button className="tiny-button" onClick={onClose} type="button">close</button>
        </div>

        <div className="preset-preview">
          <span className="preset-preview__icon">{preset.icon}</span>
          <div>
            <strong>{preset.name}</strong>
            <span>{preset.items.length} goals · {preset.barStyle.replace(/-/g, " ")}</span>
          </div>
          <ProgressBar animated={false} percent={64} preview showNumber={false} size="small" styleId={preset.barStyle} />
        </div>

        <div className="share-actions">
          <button className="primary-button" disabled={creating} onClick={createShortLink} type="button">
            {creating ? "creating…" : "create short link"}
          </button>
          <button className="secondary-button" onClick={copyFallbackLink} type="button">copy link</button>
          <button className="secondary-button" onClick={copyCode} type="button">copy code</button>
          <button className="secondary-button" onClick={exportFile} type="button">export file</button>
        </div>

        {shortLink && <ReadonlyShareField label="short link" value={shortLink} onCopy={() => copyText(shortLink).then(() => setStatus("short link copied"))} />}
        {showFallback && <ReadonlyShareField label="fallback link" value={fallbackLink} onCopy={copyFallbackLink} />}

        <p className="share-note">shares goals, not your completion state</p>
        {status && <p className="share-status">{status}</p>}
      </motion.section>
    </motion.div>
  );
}

function ReadonlyShareField({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <label className="share-field">
      <span>{label}</span>
      <div>
        <input readOnly value={value} />
        <button onClick={onCopy} type="button">copy</button>
      </div>
    </label>
  );
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function downloadPreset(preset: SharedPreset) {
  const slug = preset.name.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "preset";
  const blob = new Blob([JSON.stringify(preset, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `miniprogress-${slug}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
