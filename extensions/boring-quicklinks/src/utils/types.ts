export interface QuickLink {
  id: string;
  name: string;
  url?: string;
  icon?: ItemIcon;
  color?: string;
  keywords?: string[];
  isContainer?: boolean;
  children?: QuickLink[];
  useCount?: number;
  lastUsedAt?: number;
}

export type ItemIcon =
  | { type: "emoji"; value: string }
  | { type: "raycast"; value: string }
  | { type: "favicon"; value: string }
  | { type: "brand"; value: string }
  | { type: "url"; value: string };

export interface QuickLinksData {
  version: 1;
  items: QuickLink[];
}

export type BreadcrumbEntry = { id: string; name: string };
export type BreadcrumbPath = BreadcrumbEntry[];

export interface ContainerTarget {
  id: string | null;
  name: string;
  path: string;
}

export const ICON_COLORS: { name: string; value: string }[] = [
  { name: "Default", value: "" },
  { name: "Red", value: "#FF6363" },
  { name: "Orange", value: "#FF9F43" },
  { name: "Yellow", value: "#FECA57" },
  { name: "Green", value: "#5AD45A" },
  { name: "Teal", value: "#48DBFB" },
  { name: "Blue", value: "#54A0FF" },
  { name: "Purple", value: "#A855F7" },
  { name: "Pink", value: "#FF6B9D" },
  { name: "White", value: "#FFFFFF" },
  { name: "Gray", value: "#8395A7" },
];
