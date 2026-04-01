import { describe, expect, it } from "vitest";
import {
  canDropPaletteItem,
  extractPaletteDragType,
  resolveCanvasDropIndex,
} from "./paletteDragLogic";

describe("paletteDragLogic", () => {
  it("extracts palette drag type from drag data", () => {
    expect(
      extractPaletteDragType({
        source: "palette",
        questionType: "multiple_choice",
      }),
    ).toBe("multiple_choice");
  });

  it("returns null for non-palette sources", () => {
    expect(
      extractPaletteDragType({
        source: "canvas-question",
        questionType: "short_text",
      }),
    ).toBeNull();
  });

  it("resolves drop index from slot id", () => {
    expect(
      resolveCanvasDropIndex(
        "canvas-slot:2",
        "form-1",
        ["q-1", "q-2", "q-3", "q-4"],
      ),
    ).toBe(2);
  });

  it("resolves drop index from question id", () => {
    expect(
      resolveCanvasDropIndex("q-3", "form-1", ["q-1", "q-2", "q-3", "q-4"]),
    ).toBe(2);
  });

  it("returns end index when hovering over canvas container", () => {
    expect(
      resolveCanvasDropIndex(
        "canvas-drop:form-1",
        "form-1",
        ["q-1", "q-2", "q-3"],
      ),
    ).toBe(3);
  });

  it("reports invalid drop target outside canvas", () => {
    expect(canDropPaletteItem("question-config-panel", "form-1", ["q-1"])).toBe(
      false,
    );
  });
});
