type Env = {
  PRESETS_KV?: KVNamespace;
};

const ID_PATTERN = /^[a-z2-9]{8,10}$/;

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  if (!env.PRESETS_KV) {
    return json({ error: "preset not found" }, 404);
  }

  const id = String(params.id ?? "");
  if (!ID_PATTERN.test(id)) {
    return json({ error: "preset not found" }, 404);
  }

  const preset = await env.PRESETS_KV.get(`preset:${id}`);
  if (!preset) {
    return json({ error: "preset not found" }, 404);
  }

  return new Response(preset, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60"
    }
  });
};


function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
