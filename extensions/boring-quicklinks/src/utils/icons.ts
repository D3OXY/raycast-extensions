import { Icon, Image, environment } from "@raycast/api";
import { getFavicon } from "@raycast/utils";
import { QuickLink, ItemIcon } from "./types";
import * as simpleIcons from "simple-icons";

export function isUrl(str: string): boolean {
  return str.startsWith("http://") || str.startsWith("https://");
}

export function isFilePath(str: string): boolean {
  return str.startsWith("/") || str.startsWith("~") || str.startsWith("file://");
}

function highResFavicon(url: string): Image.ImageLike {
  return getFavicon(url, { fallback: Icon.Globe });
}

const brandCache = new Map<string, string>();

function brandIconDataUri(slug: string, fill: string): string {
  const key = `${slug}:${fill}`;
  const cached = brandCache.get(key);
  if (cached) return cached;

  const allIcons = Object.values(simpleIcons).filter(
    (v): v is { slug: string; path: string; title: string; hex: string } =>
      typeof v === "object" && v !== null && "slug" in v,
  );
  const icon = allIcons.find((i) => i.slug === slug.toLowerCase());
  if (!icon) return "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fill}"><path d="${icon.path}"/></svg>`;
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  brandCache.set(key, dataUri);
  return dataUri;
}

function resolveItemIcon(icon: ItemIcon, color?: string): Image.ImageLike {
  switch (icon.type) {
    case "emoji":
      return icon.value;
    case "raycast": {
      const rcIcon = (Icon as Record<string, Image.ImageLike>)[icon.value] ?? Icon.Link;
      if (color) {
        return {
          source: rcIcon as Image.Source,
          tintColor: { light: color, dark: color, adjustContrast: false },
        };
      }
      return rcIcon;
    }
    case "favicon":
      return highResFavicon(icon.value);
    case "brand": {
      const isDark = environment.theme === "dark";
      const fill = color || (isDark ? "#ffffff" : "#000000");
      const uri = brandIconDataUri(icon.value, fill);
      if (!uri) return Icon.Globe;
      return { source: uri, fallback: Icon.Globe };
    }
    case "url":
      return { source: icon.value, fallback: Icon.Globe };
  }
}

export function resolveIcon(item: QuickLink): Image.ImageLike {
  if (item.icon) {
    return resolveItemIcon(item.icon, item.color);
  }

  if (item.isContainer && !item.url) {
    if (item.color) {
      return {
        source: Icon.Folder as Image.Source,
        tintColor: {
          light: item.color,
          dark: item.color,
          adjustContrast: false,
        },
      };
    }
    return Icon.Folder;
  }

  if (item.url && isUrl(item.url)) {
    return highResFavicon(item.url);
  }

  if (item.url && isFilePath(item.url)) {
    return { fileIcon: item.url };
  }

  return item.isContainer ? Icon.Folder : Icon.Link;
}
