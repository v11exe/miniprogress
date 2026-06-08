export type Theme = "light" | "dark";

export type ProgressBarStyleId =
  | "soft-pill"
  | "glass-tube"
  | "segmented-capsule"
  | "rounded-blocks"
  | "diagonal-stripe"
  | "chevron"
  | "pixel-battery"
  | "thin-slider"
  | "inner-glow"
  | "stepped-dots";

export type ProgressItem = {
  id: string;
  label: string;
  completed: boolean;
  autoCompleteAt?: string | null;
};

export type ProgressList = {
  id: string;
  name: string;
  icon: string;
  items: ProgressItem[];
  createdAt: string;
  presetId?: string | null;
  barStyle: ProgressBarStyleId;
};

export type AppState = {
  progressLists: ProgressList[];
  selectedProgressId: string | null;
  theme: Theme;
};

export type PresetId = "gcse-exams" | "football-season" | "reading-list";

type CreateProgressInput = {
  name: string;
  icon: string;
  itemLabels: string[];
  presetId?: string | null;
  barStyle?: ProgressBarStyleId;
};

type PersistedProgressItem = Partial<ProgressItem>;
type PersistedProgressList = Partial<Omit<ProgressList, "items">> & {
  items?: PersistedProgressItem[];
};

export const STORAGE_KEY = "miniprogress:v1";
export const THEME_KEY = "miniprogress:theme";
export const DEFAULT_BAR_STYLE: ProgressBarStyleId = "soft-pill";

export const barStyleOptions: Array<{
  id: ProgressBarStyleId;
  label: string;
}> = [
  { id: "soft-pill", label: "soft pill" },
  { id: "glass-tube", label: "glass tube" },
  { id: "segmented-capsule", label: "segmented capsule" },
  { id: "rounded-blocks", label: "rounded blocks" },
  { id: "diagonal-stripe", label: "diagonal stripe" },
  { id: "chevron", label: "chevron" },
  { id: "pixel-battery", label: "pixel battery" },
  { id: "thin-slider", label: "thin slider" },
  { id: "inner-glow", label: "inner glow" },
  { id: "stepped-dots", label: "stepped dots" }
];

const barStyleIds = new Set<ProgressBarStyleId>(
  barStyleOptions.map((style) => style.id)
);

const placeholderLabels = ["step 1", "step 2", "step 3", "step 4", "step 5"];

const presets: Record<
  PresetId,
  { name: string; icon: string; items: string[]; barStyle: ProgressBarStyleId }
> = {
  "gcse-exams": {
    name: "gcse exams",
    icon: "✦",
    items: [
      "english language",
      "english literature",
      "maths",
      "biology",
      "chemistry",
      "physics",
      "geography",
      "computer science"
    ],
    barStyle: "soft-pill"
  },
  "football-season": {
    name: "football season",
    icon: "⚽",
    items: ["match 1", "match 2", "match 3", "match 4", "match 5"],
    barStyle: "segmented-capsule"
  },
  "reading-list": {
    name: "reading list",
    icon: "◌",
    items: ["book 1", "book 2", "book 3", "book 4", "book 5"],
    barStyle: "glass-tube"
  }
};

export const presetOptions = Object.entries(presets).map(([id, preset]) => ({
  id: id as PresetId,
  name: preset.name,
  icon: preset.icon
}));

export function buildInitialState(theme: Theme): AppState {
  return {
    progressLists: [],
    selectedProgressId: null,
    theme
  };
}

export function calculateProgressPercent(items: ProgressItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  const completed = items.filter((item) => item.completed).length;
  return Math.round((completed / items.length) * 100);
}

export function createProgressList(input: CreateProgressInput): ProgressList {
  const normalizedLabels = input.itemLabels.map(normalizeLabel).filter(Boolean);
  const labels = normalizedLabels.length > 0 ? normalizedLabels : placeholderLabels;

  return {
    id: createId(),
    name: normalizeLabel(input.name),
    icon: input.icon.trim() || "✦",
    items: labels.map(createProgressItem),
    createdAt: new Date().toISOString(),
    presetId: input.presetId ?? null,
    barStyle: normalizeBarStyle(input.barStyle)
  };
}

export function createPresetProgressList(presetId: PresetId): ProgressList {
  const preset = presets[presetId];

  return createProgressList({
    name: preset.name,
    icon: preset.icon,
    itemLabels: preset.items,
    presetId,
    barStyle: preset.barStyle
  });
}

export function toggleProgressItem(
  list: ProgressList,
  itemId: string
): ProgressList {
  return {
    ...list,
    items: list.items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
  };
}

export function addProgressItem(
  list: ProgressList,
  label = "new goal"
): ProgressList {
  return {
    ...list,
    items: [...list.items, createProgressItem(normalizeLabel(label) || "new goal")]
  };
}

export function deleteProgressItem(
  list: ProgressList,
  itemId: string
): ProgressList {
  return {
    ...list,
    items: list.items.filter((item) => item.id !== itemId)
  };
}

export function renameProgressItem(
  list: ProgressList,
  itemId: string,
  label: string
): ProgressList {
  const normalized = normalizeLabel(label);

  if (!normalized) {
    return list;
  }

  return {
    ...list,
    items: list.items.map((item) =>
      item.id === itemId ? { ...item, label: normalized } : item
    )
  };
}

export function setProgressItemSchedule(
  list: ProgressList,
  itemId: string,
  autoCompleteAt: string | null
): ProgressList {
  return {
    ...list,
    items: list.items.map((item) =>
      item.id === itemId ? { ...item, autoCompleteAt } : item
    )
  };
}

export function setProgressBarStyle(
  list: ProgressList,
  barStyle: ProgressBarStyleId
): ProgressList {
  return {
    ...list,
    barStyle: normalizeBarStyle(barStyle)
  };
}

export function deleteProgressListFromState(
  state: AppState,
  listId: string
): AppState {
  const deletedIndex = state.progressLists.findIndex((list) => list.id === listId);
  const progressLists = state.progressLists.filter((list) => list.id !== listId);
  const selectedProgressId =
    progressLists.length === 0
      ? null
      : progressLists[Math.min(Math.max(deletedIndex, 0), progressLists.length - 1)]
          .id;

  return {
    ...state,
    progressLists,
    selectedProgressId
  };
}

export function migrateProgressList(input: PersistedProgressList): ProgressList {
  const fallbackName = typeof input.name === "string" ? input.name : "untitled";
  const items = Array.isArray(input.items) ? input.items : [];

  return {
    id: typeof input.id === "string" ? input.id : createId(),
    name: normalizeLabel(fallbackName) || "untitled",
    icon: typeof input.icon === "string" && input.icon.trim() ? input.icon : "✦",
    items: items.map(migrateProgressItem),
    createdAt:
      typeof input.createdAt === "string"
        ? input.createdAt
        : new Date().toISOString(),
    presetId: typeof input.presetId === "string" ? input.presetId : null,
    barStyle: normalizeBarStyle(input.barStyle)
  };
}

export function applyScheduledCompletions(
  state: AppState,
  now = new Date()
): AppState {
  let changed = false;
  const timestamp = now.getTime();
  const progressLists = state.progressLists.map((list) => {
    const items = list.items.map((item) => {
      if (
        item.completed ||
        !item.autoCompleteAt ||
        Number.isNaN(Date.parse(item.autoCompleteAt)) ||
        Date.parse(item.autoCompleteAt) > timestamp
      ) {
        return item;
      }

      changed = true;
      return { ...item, completed: true };
    });

    return items === list.items ? list : { ...list, items };
  });

  return changed ? { ...state, progressLists } : state;
}

export function normalizeLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function resolveSelectedList(state: AppState): ProgressList | null {
  return (
    state.progressLists.find((list) => list.id === state.selectedProgressId) ??
    state.progressLists[0] ??
    null
  );
}

export function serializeState(state: AppState): string {
  return JSON.stringify(state);
}

export function parseState(value: string | null, fallbackTheme: Theme): AppState {
  if (!value) {
    return buildInitialState(fallbackTheme);
  }

  try {
    const parsed = JSON.parse(value) as Partial<AppState>;
    const progressLists = Array.isArray(parsed.progressLists)
      ? parsed.progressLists.map(migrateProgressList)
      : [];
    const savedSelection =
      typeof parsed.selectedProgressId === "string"
        ? parsed.selectedProgressId
        : null;
    const selectedProgressId =
      progressLists.find((list) => list.id === savedSelection)?.id ??
      progressLists[0]?.id ??
      null;
    const theme =
      parsed.theme === "dark" || parsed.theme === "light"
        ? parsed.theme
        : fallbackTheme;

    return applyScheduledCompletions({
      progressLists,
      selectedProgressId,
      theme
    });
  } catch {
    return buildInitialState(fallbackTheme);
  }
}

function createProgressItem(label: string): ProgressItem {
  return {
    id: createId(),
    label,
    completed: false,
    autoCompleteAt: null
  };
}

function migrateProgressItem(input: PersistedProgressItem): ProgressItem {
  return {
    id: typeof input.id === "string" ? input.id : createId(),
    label:
      typeof input.label === "string" && normalizeLabel(input.label)
        ? normalizeLabel(input.label)
        : "new goal",
    completed: Boolean(input.completed),
    autoCompleteAt:
      typeof input.autoCompleteAt === "string" ? input.autoCompleteAt : null
  };
}

function normalizeBarStyle(
  style: ProgressBarStyleId | string | null | undefined
): ProgressBarStyleId {
  return barStyleIds.has(style as ProgressBarStyleId)
    ? (style as ProgressBarStyleId)
    : DEFAULT_BAR_STYLE;
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
