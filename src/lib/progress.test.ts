import { describe, expect, it } from "vitest";
import {
  addProgressItem,
  applyScheduledCompletions,
  barStyleOptions,
  buildInitialState,
  calculateProgressPercent,
  createProgressList,
  createPresetProgressList,
  deleteProgressItem,
  deleteProgressListFromState,
  migrateProgressList,
  renameProgressItem,
  setProgressBarStyle,
  setProgressItemSchedule,
  shouldCelebrateCompletion,
  toggleProgressItem
} from "./progress";

describe("progress list behavior", () => {
  it("calculates rounded completion percentage from completed items", () => {
    const percent = calculateProgressPercent([
      { id: "1", label: "one", completed: true, autoCompleteAt: null },
      { id: "2", label: "two", completed: false, autoCompleteAt: null },
      { id: "3", label: "three", completed: true, autoCompleteAt: null }
    ]);

    expect(percent).toBe(67);
  });

  it("celebrates only when progress crosses into complete", () => {
    expect(shouldCelebrateCompletion(80, 100)).toBe(true);
    expect(shouldCelebrateCompletion(null, 100)).toBe(false);
    expect(shouldCelebrateCompletion(100, 100)).toBe(false);
    expect(shouldCelebrateCompletion(100, 80)).toBe(false);
    expect(shouldCelebrateCompletion(40, 60)).toBe(false);
  });

  it("uses five lowercase placeholder steps when custom list has no items", () => {
    const list = createProgressList({
      name: "  My Course  ",
      icon: "✦",
      itemLabels: [],
      barStyle: "glass-tube"
    });

    expect(list.name).toBe("my course");
    expect(list.barStyle).toBe("glass-tube");
    expect(list.items.map((item) => item.label)).toEqual([
      "step 1",
      "step 2",
      "step 3",
      "step 4",
      "step 5"
    ]);
  });

  it("creates placeholder presets with scheduling fields and default style", () => {
    const list = createPresetProgressList("gcse-exams");

    expect(list.name).toBe("gcse exams");
    expect(list.presetId).toBe("gcse-exams");
    expect(list.barStyle).toBe("soft-pill");
    expect(list.items).toHaveLength(8);
    expect(list.items[0]).toHaveProperty("autoCompleteAt", null);
  });

  it("toggles a checklist item without mutating the original list", () => {
    const list = createProgressList({
      name: "reading list",
      icon: "◌",
      itemLabels: ["book 1", "book 2"],
      barStyle: "soft-pill"
    });
    const updated = toggleProgressItem(list, list.items[0].id);

    expect(updated.items[0].completed).toBe(true);
    expect(list.items[0].completed).toBe(false);
  });

  it("builds first-visit state from the preferred theme", () => {
    const state = buildInitialState("dark");

    expect(state.progressLists).toEqual([]);
    expect(state.selectedProgressId).toBeNull();
    expect(state.theme).toBe("dark");
  });

  it("exposes exactly ten progress bar style options", () => {
    expect(barStyleOptions.map((style) => style.id)).toEqual([
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
  });

  it("migrates v1.0 lists with default bar style and null schedules", () => {
    const migrated = migrateProgressList({
      id: "old-list",
      name: "old list",
      icon: "✦",
      createdAt: "2026-01-01T00:00:00.000Z",
      items: [{ id: "old-item", label: "paper 1", completed: false }]
    });

    expect(migrated.barStyle).toBe("soft-pill");
    expect(migrated.items[0].autoCompleteAt).toBeNull();
  });

  it("adds, renames, schedules, deletes, and restyles goals immutably", () => {
    const list = createProgressList({
      name: "reading list",
      icon: "◌",
      itemLabels: ["book 1"],
      barStyle: "soft-pill"
    });
    const added = addProgressItem(list, "New Goal");
    const addedItem = added.items[1];
    const renamed = renameProgressItem(added, addedItem.id, "  final essay ");
    const scheduled = setProgressItemSchedule(
      renamed,
      addedItem.id,
      "2026-06-08T12:00:00.000Z"
    );
    const restyled = setProgressBarStyle(scheduled, "stepped-dots");
    const deleted = deleteProgressItem(restyled, list.items[0].id);

    expect(list.items).toHaveLength(1);
    expect(added.items).toHaveLength(2);
    expect(renamed.items[1].label).toBe("final essay");
    expect(scheduled.items[1].autoCompleteAt).toBe("2026-06-08T12:00:00.000Z");
    expect(restyled.barStyle).toBe("stepped-dots");
    expect(deleted.items.map((item) => item.label)).toEqual(["final essay"]);
  });

  it("auto-completes scheduled items whose date has passed", () => {
    const list = createProgressList({
      name: "habits",
      icon: "✦",
      itemLabels: ["drink water", "sleep"],
      barStyle: "soft-pill"
    });
    const scheduled = setProgressItemSchedule(
      list,
      list.items[0].id,
      "2026-06-08T10:00:00.000Z"
    );
    const state = {
      progressLists: [scheduled],
      selectedProgressId: scheduled.id,
      theme: "dark" as const
    };
    const updated = applyScheduledCompletions(
      state,
      new Date("2026-06-08T10:01:00.000Z")
    );

    expect(updated.progressLists[0].items[0].completed).toBe(true);
    expect(updated.progressLists[0].items[0].autoCompleteAt).toBe(
      "2026-06-08T10:00:00.000Z"
    );
  });

  it("deletes the selected list and selects the next available list", () => {
    const first = createProgressList({
      name: "first",
      icon: "✦",
      itemLabels: ["one"],
      barStyle: "soft-pill"
    });
    const second = createProgressList({
      name: "second",
      icon: "◌",
      itemLabels: ["two"],
      barStyle: "glass-tube"
    });

    const state = deleteProgressListFromState(
      {
        progressLists: [first, second],
        selectedProgressId: first.id,
        theme: "light"
      },
      first.id
    );

    expect(state.progressLists).toHaveLength(1);
    expect(state.selectedProgressId).toBe(second.id);
  });
});
