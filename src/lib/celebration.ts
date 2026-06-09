type BurstOptions = {
  count?: number;
  spread?: number;
  speed?: number;
  lifetime?: number;
};

export function prefersReducedCelebrationMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function celebrateCompletion(target: HTMLElement | null) {
  if (!target) return;
  target.classList.remove("complete-pulse");
  void target.offsetWidth;
  target.classList.add("complete-pulse");
  window.setTimeout(() => target.classList.remove("complete-pulse"), 980);

  if (prefersReducedCelebrationMotion()) return;

  const rect = target.getBoundingClientRect();
  burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, {
    count: 18,
    spread: 42,
    speed: 34,
    lifetime: 760
  });
}

export function celebrateBackgroundClick(event: MouseEvent | PointerEvent) {
  if (prefersReducedCelebrationMotion()) return;
  burstAt(event.clientX, event.clientY, {
    count: 11,
    spread: 30,
    speed: 22,
    lifetime: 520
  });
}

function burstAt(x: number, y: number, options: BurstOptions) {
  if (tryPartyJsBurst(x, y, options)) {
    return;
  }

  void loadPartyJs().then((party) => {
    if (party) {
      emitPartyJsBurst(party, x, y, options);
    }
  });

  const root = document.createElement("div");
  root.className = "party-js-micro-burst";
  root.style.left = `${x}px`;
  root.style.top = `${y}px`;
  const count = options.count ?? 12;

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement("span");
    const angle = -90 + (Math.random() - 0.5) * (options.spread ?? 36);
    const distance = (options.speed ?? 26) * (0.55 + Math.random() * 0.75);
    particle.style.setProperty("--party-x", `${Math.cos((angle * Math.PI) / 180) * distance}px`);
    particle.style.setProperty("--party-y", `${Math.sin((angle * Math.PI) / 180) * distance}px`);
    particle.style.setProperty("--party-size", `${2 + Math.random() * 4}px`);
    particle.style.setProperty("--party-delay", `${Math.random() * 50}ms`);
    particle.style.setProperty("--party-life", `${options.lifetime ?? 620}ms`);
    particle.style.setProperty("--party-color", index % 4 === 0 ? "color-mix(in srgb, var(--text) 18%, transparent)" : "var(--green)");
    root.appendChild(particle);
  }

  document.body.appendChild(root);
  window.setTimeout(() => root.remove(), (options.lifetime ?? 620) + 160);
}


type PartyJsApi = {
  sparkles?: (source: { x: number; y: number }, options?: Record<string, unknown>) => void;
  confetti?: (source: { x: number; y: number }, options?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    party?: PartyJsApi;
    __miniprogressPartyLoading?: Promise<PartyJsApi | null>;
  }
}

function tryPartyJsBurst(x: number, y: number, options: BurstOptions): boolean {
  const party = window.party;
  if (!party) return false;
  emitPartyJsBurst(party, x, y, options);
  return true;
}

function emitPartyJsBurst(party: PartyJsApi, x: number, y: number, options: BurstOptions) {
  const source = { x, y };
  const config = {
    count: options.count ?? 12,
    spread: options.spread ?? 34,
    speed: options.speed ?? 24,
    size: 0.72,
    color: ["var(--green)"]
  };

  try {
    if (party.sparkles) {
      party.sparkles(source, config);
      return;
    }
    party.confetti?.(source, config);
  } catch {
    // keep celebrations non-blocking if a CDN/runtime Party.js API changes
  }
}

function loadPartyJs(): Promise<PartyJsApi | null> {
  if (window.party) return Promise.resolve(window.party);
  if (window.__miniprogressPartyLoading) return window.__miniprogressPartyLoading;

  window.__miniprogressPartyLoading = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/party-js@latest/bundle/party.min.js";
    script.async = true;
    script.onload = () => resolve(window.party ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return window.__miniprogressPartyLoading;
}
