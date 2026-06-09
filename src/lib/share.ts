import {
  DEFAULT_BAR_STYLE,
  ProgressBarStyleId,
  ProgressList,
  barStyleOptions,
  normalizeLabel
} from "./progress";

export const SHARE_SCHEMA = "miniprogress-preset";
export const SHARE_VERSION = 1;
export const SHARE_CODE_PREFIX = "mp1_";
export const MAX_SHARE_TEXT_SIZE = 48_000;

export type SharedPreset = {
  schema: typeof SHARE_SCHEMA;
  version: typeof SHARE_VERSION;
  exportedAt: string;
  name: string;
  icon: string;
  barStyle: ProgressBarStyleId;
  items: Array<{
    label: string;
    autoCompleteAt?: string | null;
  }>;
};

export type ImportPreview = {
  preset: SharedPreset;
  totalGoals: number;
  alreadyComplete: number;
  scheduled: number;
  previewPercent: number;
};

const barStyleIds = new Set(barStyleOptions.map((style) => style.id));

export function createSharedPreset(list: ProgressList): SharedPreset {
  return sanitizePreset({
    schema: SHARE_SCHEMA,
    version: SHARE_VERSION,
    exportedAt: new Date().toISOString(),
    name: list.name,
    icon: list.icon,
    barStyle: list.barStyle,
    items: list.items.map((item) => ({
      label: item.label,
      autoCompleteAt: item.autoCompleteAt ?? null
    }))
  });
}

export function encodePreset(preset: SharedPreset): string {
  return base64UrlEncode(JSON.stringify(sanitizePreset(preset)));
}

export function createShareCode(preset: SharedPreset): string {
  return `${SHARE_CODE_PREFIX}${encodePreset(preset)}`;
}

export function createEncodedImportUrl(preset: SharedPreset, origin = window.location.origin): string {
  return `${origin}/import#data=${encodePreset(preset)}`;
}

export function decodeShareText(input: string): SharedPreset {
  const trimmed = input.trim();
  const payload = trimmed.startsWith(SHARE_CODE_PREFIX)
    ? trimmed.slice(SHARE_CODE_PREFIX.length)
    : extractDataPayload(trimmed);

  if (!payload || payload.length > MAX_SHARE_TEXT_SIZE) {
    throw new Error("invalid preset");
  }

  return validateSharedPreset(JSON.parse(base64UrlDecode(payload)));
}

export function parseImportHash(hash: string): SharedPreset | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const data = params.get("data");

  if (!data) {
    return null;
  }

  return decodeShareText(data);
}

export function readPresetFile(file: File): Promise<SharedPreset> {
  if (file.size > MAX_SHARE_TEXT_SIZE) {
    return Promise.reject(new Error("file too large"));
  }

  return file.text().then((text) => validateSharedPreset(JSON.parse(text)));
}

export function buildImportPreview(preset: SharedPreset, now = new Date()): ImportPreview {
  const timestamp = now.getTime();
  const alreadyComplete = preset.items.filter((item) => isPastIso(item.autoCompleteAt, timestamp)).length;
  const scheduled = preset.items.filter((item) => Boolean(item.autoCompleteAt)).length;
  const previewPercent = preset.items.length
    ? Math.round((alreadyComplete / preset.items.length) * 100)
    : 0;

  return {
    preset,
    totalGoals: preset.items.length,
    alreadyComplete,
    scheduled,
    previewPercent: previewPercent || 64
  };
}

export function createImportedList(preset: SharedPreset, now = new Date()): ProgressList {
  const timestamp = now.getTime();

  return {
    id: createId(),
    name: preset.name,
    icon: preset.icon,
    barStyle: preset.barStyle,
    createdAt: new Date().toISOString(),
    presetId: null,
    items: preset.items.map((item) => ({
      id: createId(),
      label: item.label,
      completed: isPastIso(item.autoCompleteAt, timestamp),
      autoCompleteAt: item.autoCompleteAt ?? null
    }))
  };
}

export function validateSharedPreset(value: unknown): SharedPreset {
  if (!value || typeof value !== "object") {
    throw new Error("invalid preset");
  }

  const input = value as Partial<SharedPreset>;

  if (input.schema !== SHARE_SCHEMA || input.version !== SHARE_VERSION) {
    throw new Error("invalid preset");
  }

  if (typeof input.exportedAt !== "string" || Number.isNaN(Date.parse(input.exportedAt))) {
    throw new Error("invalid preset");
  }

  if (typeof input.name !== "string" || input.name.trim().length === 0 || input.name.length > 60) {
    throw new Error("invalid preset");
  }

  if (typeof input.icon !== "string" || input.icon.length > 8) {
    throw new Error("invalid preset");
  }

  if (!barStyleIds.has(input.barStyle ?? DEFAULT_BAR_STYLE)) {
    throw new Error("invalid preset");
  }

  if (!Array.isArray(input.items) || input.items.length > 100) {
    throw new Error("invalid preset");
  }

  return sanitizePreset(input as SharedPreset);
}

function sanitizePreset(input: SharedPreset): SharedPreset {
  return {
    schema: SHARE_SCHEMA,
    version: SHARE_VERSION,
    exportedAt: input.exportedAt,
    name: normalizeLabel(input.name).slice(0, 60) || "imported preset",
    icon: (input.icon || "✦").trim().slice(0, 8) || "✦",
    barStyle: barStyleIds.has(input.barStyle) ? input.barStyle : DEFAULT_BAR_STYLE,
    items: input.items.slice(0, 100).map((item) => {
      if (!item || typeof item.label !== "string") {
        throw new Error("invalid preset");
      }

      const label = normalizeLabel(item.label).slice(0, 100);
      const autoCompleteAt = normalizeIso(item.autoCompleteAt);

      if (!label) {
        throw new Error("invalid preset");
      }

      return { label, autoCompleteAt };
    })
  };
}

function normalizeIso(value: string | null | undefined): string | null {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new Error("invalid preset");
  }

  return new Date(value).toISOString();
}

function isPastIso(value: string | null | undefined, timestamp: number): boolean {
  return Boolean(value && !Number.isNaN(Date.parse(value)) && Date.parse(value) <= timestamp);
}

function extractDataPayload(value: string): string {
  if (!value.includes("#") && !value.includes("data=")) {
    return value;
  }

  try {
    const url = new URL(value, window.location.origin);
    return new URLSearchParams(url.hash.replace(/^#/, "")).get("data") ?? "";
  } catch {
    return "";
  }
}

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
