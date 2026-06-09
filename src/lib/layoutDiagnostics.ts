const OVERLAP_SELECTORS = [
  ".brand-title--progress",
  ".focus-card",
  ".tiny-menu",
  ".confirm-popover",
  ".picker-popover",
  ".schedule-popover",
  ".modal-backdrop"
];

const TEXT_SELECTORS = [
  ".brand-title",
  ".focus-card h2",
  ".progress-bar__number",
  ".checklist-item__label",
  ".editable-goal-row input",
  ".bar-style-option span",
  ".tiny-menu button"
];

let cleanup: (() => void) | null = null;

export function installLayoutDiagnostics() {
  const isDev = (import.meta as ImportMeta & { env?: { DEV?: boolean } })
    .env?.DEV;

  if (!isDev || typeof window === "undefined" || cleanup) {
    return;
  }

  let frameId = 0;

  const schedule = () => {
    window.cancelAnimationFrame(frameId);
    frameId = window.requestAnimationFrame(runLayoutDiagnostics);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true
  });

  window.addEventListener("resize", schedule);
  window.setTimeout(schedule, 250);

  cleanup = () => {
    window.cancelAnimationFrame(frameId);
    window.removeEventListener("resize", schedule);
    observer.disconnect();
    cleanup = null;
  };
}

function runLayoutDiagnostics() {
  const overflow = document.documentElement.scrollWidth - window.innerWidth;

  if (overflow > 1) {
    console.warn("[layout] horizontal overflow", {
      overflow,
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth
    });
  }

  for (const element of document.querySelectorAll<HTMLElement>(
    TEXT_SELECTORS.join(",")
  )) {
    if (element.scrollWidth - element.clientWidth > 2) {
      console.warn("[layout] clipped text", describeElement(element));
    }
  }

  const visible = OVERLAP_SELECTORS.flatMap((selector) =>
    Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(isVisible)
  );

  for (let index = 0; index < visible.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < visible.length; nextIndex += 1) {
      const first = visible[index];
      const second = visible[nextIndex];

      if (allowedOverlap(first, second)) {
        continue;
      }

      if (rectsOverlap(first.getBoundingClientRect(), second.getBoundingClientRect())) {
        console.warn("[layout] possible overlap", {
          first: describeElement(first),
          second: describeElement(second)
        });
      }
    }
  }
}

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== "hidden" &&
    style.display !== "none"
  );
}

function allowedOverlap(first: HTMLElement, second: HTMLElement) {
  return (
    first.contains(second) ||
    second.contains(first) ||
    first.classList.contains("modal-backdrop") ||
    second.classList.contains("modal-backdrop")
  );
}

function rectsOverlap(first: DOMRect, second: DOMRect) {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}

function describeElement(element: HTMLElement) {
  const id = element.id ? `#${element.id}` : "";
  const classes = Array.from(element.classList)
    .map((className) => `.${className}`)
    .join("");
  return `${element.tagName.toLowerCase()}${id}${classes}`;
}
