type Env = {
  PRESETS_KV?: KVNamespace;
};

const TTL_SECONDS = 365 * 24 * 60 * 60;
const MAX_BODY_BYTES = 48_000;
const ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const VALID_STYLES = new Set([
  "soft-pill",
  "glass-tube",
  "segmented-capsule",
  "rounded-blocks",
  "diagonal-stripe",
  "chevron",
  "pixel-battery",
  "thin-slider",
  "inner-glow",
  "stepped-dots"
]);

type SharedPreset = {
  schema: "miniprogress-preset";
  version: 1;
  exportedAt: string;
  name: string;
  icon: string;
  barStyle: string;
  items: Array<{ label: string; autoCompleteAt?: string | null }>;
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.PRESETS_KV) {
      return json({ error: "short link unavailable" }, 503);
    }

    const type = request.headers.get("content-type") ?? "";
    if (!type.includes("application/json")) {
      return json({ error: "json required" }, 415);
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ error: "preset too large" }, 413);
    }

    const preset = validatePreset(JSON.parse(raw));
    const id = await createUniqueId(env.PRESETS_KV);
    await env.PRESETS_KV.put(`preset:${id}`, JSON.stringify(preset), {
      expirationTtl: TTL_SECONDS,
      metadata: { schema: preset.schema, version: preset.version }
    });

    return json({ id, url: `/p/${id}` });
  } catch {
    return json({ error: "short link unavailable" }, 400);
  }
};


async function createUniqueId(kv: KVNamespace): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = randomId();
    if (!(await kv.get(`preset:${id}`))) {
      return id;
    }
  }
  throw new Error("collision");
}

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (byte) => ID_ALPHABET[byte % ID_ALPHABET.length]).join("");
}

function validatePreset(value: unknown): SharedPreset {
  const preset = value as Partial<SharedPreset>;
  if (!preset || preset.schema !== "miniprogress-preset" || preset.version !== 1) throw new Error("invalid");
  if (typeof preset.exportedAt !== "string" || Number.isNaN(Date.parse(preset.exportedAt))) throw new Error("invalid");
  if (typeof preset.name !== "string" || preset.name.trim().length === 0 || preset.name.length > 60) throw new Error("invalid");
  if (typeof preset.icon !== "string" || preset.icon.length > 8) throw new Error("invalid");
  if (typeof preset.barStyle !== "string" || !VALID_STYLES.has(preset.barStyle)) throw new Error("invalid");
  if (!Array.isArray(preset.items) || preset.items.length > 100) throw new Error("invalid");

  return {
    schema: "miniprogress-preset",
    version: 1,
    exportedAt: new Date(preset.exportedAt).toISOString(),
    name: preset.name.trim().replace(/\s+/g, " ").toLowerCase(),
    icon: preset.icon.trim() || "✦",
    barStyle: preset.barStyle,
    items: preset.items.map((item) => {
      if (!item || typeof item.label !== "string" || item.label.trim().length === 0 || item.label.length > 100) throw new Error("invalid");
      const autoCompleteAt = item.autoCompleteAt == null || item.autoCompleteAt === "" ? null : item.autoCompleteAt;
      if (autoCompleteAt !== null && (typeof autoCompleteAt !== "string" || Number.isNaN(Date.parse(autoCompleteAt)))) throw new Error("invalid");
      return {
        label: item.label.trim().replace(/\s+/g, " ").toLowerCase(),
        autoCompleteAt: autoCompleteAt ? new Date(autoCompleteAt).toISOString() : null
      };
    })
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
