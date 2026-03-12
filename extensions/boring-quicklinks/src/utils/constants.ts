import { Grid, Keyboard } from "@raycast/api";

export const GRID_COLUMNS = 6;
export const GRID_ASPECT_RATIO = "1" as const;
export const GRID_INSET = Grid.Inset.Small;

export const SHORTCUTS = {
  edit: {
    modifiers: ["cmd"] as Keyboard.KeyModifier[],
    key: "e" as Keyboard.KeyEquivalent,
  },
  delete: {
    modifiers: ["ctrl"] as Keyboard.KeyModifier[],
    key: "x" as Keyboard.KeyEquivalent,
  },
  copyUrl: {
    modifiers: ["cmd", "shift"] as Keyboard.KeyModifier[],
    key: "c" as Keyboard.KeyEquivalent,
  },
  addLink: {
    modifiers: ["cmd"] as Keyboard.KeyModifier[],
    key: "n" as Keyboard.KeyEquivalent,
  },
  openRootLink: {
    modifiers: ["cmd"] as Keyboard.KeyModifier[],
    key: "return" as Keyboard.KeyEquivalent,
  },
  moveTo: {
    modifiers: ["cmd", "shift"] as Keyboard.KeyModifier[],
    key: "m" as Keyboard.KeyEquivalent,
  },
};
