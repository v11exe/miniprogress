import { describe, expect, it } from "vitest";
import { createProgressList } from "./progress";
import {
  buildImportPreview,
  createEncodedImportUrl,
  createImportedList,
  createShareCode,
  createSharedPreset,
  decodeShareText,
  validateSharedPreset
} from "./share";

describe("share presets", () => {
  it("shares structure without completion state and imports with fresh ids", () => {
    const list = createProgressList({
      name: "gcse exams",
      icon: "✦",
      itemLabels: ["maths", "physics"]
    });
    const completedList = {
      ...list,
      items: list.items.map((item, index) => ({ ...item, completed: index === 0 }))
    };
    const preset = createSharedPreset(completedList);
    const imported = createImportedList(preset);

    expect(preset.items).toEqual([
      { label: "maths", autoCompleteAt: null },
      { label: "physics", autoCompleteAt: null }
    ]);
    expect(imported.items.every((item) => !item.completed)).toBe(true);
    expect(imported.id).not.toBe(list.id);
    expect(imported.items[0].id).not.toBe(list.items[0].id);
  });

  it("round-trips fallback links and share codes", () => {
    const preset = createSharedPreset(
      createProgressList({ name: "reading", icon: "◌", itemLabels: ["book"] })
    );

    expect(decodeShareText(createShareCode(preset))).toEqual(preset);
    expect(decodeShareText(createEncodedImportUrl(preset, "https://miniprogress.omair.uk"))).toEqual(preset);
  });

  it("previews past scheduled goals as already complete", () => {
    const preset = validateSharedPreset({
      schema: "miniprogress-preset",
      version: 1,
      exportedAt: "2026-06-09T00:00:00.000Z",
      name: "schedule",
      icon: "✦",
      barStyle: "soft-pill",
      items: [
        { label: "past", autoCompleteAt: "2026-06-08T00:00:00.000Z" },
        { label: "future", autoCompleteAt: "2026-06-10T00:00:00.000Z" }
      ]
    });

    const preview = buildImportPreview(preset, new Date("2026-06-09T00:00:00.000Z"));
    const imported = createImportedList(preset, new Date("2026-06-09T00:00:00.000Z"));

    expect(preview.alreadyComplete).toBe(1);
    expect(preview.scheduled).toBe(2);
    expect(imported.items.map((item) => item.completed)).toEqual([true, false]);
  });

  it("rejects unexpected or oversized preset shapes", () => {
    expect(() => validateSharedPreset({ schema: "bad" })).toThrow();
    expect(() =>
      validateSharedPreset({
        schema: "miniprogress-preset",
        version: 1,
        exportedAt: "2026-06-09T00:00:00.000Z",
        name: "x",
        icon: "✦",
        barStyle: "rainbow",
        items: [{ label: "ok" }]
      })
    ).toThrow();
  });
});
