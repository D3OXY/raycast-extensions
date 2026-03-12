import { useCallback, useEffect, useState } from "react";
import { loadData, saveData } from "../storage/storage";
import { BreadcrumbPath, ContainerTarget, QuickLink, QuickLinksData } from "../utils/types";

// Module-level reactive store — works across Raycast navigation boundaries
let storeData: QuickLinksData = { version: 1, items: [] };
let storeLoaded = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

let storeInitPromise: Promise<void> | null = null;

async function initStore() {
  if (storeLoaded) return;
  if (storeInitPromise) return storeInitPromise;
  storeInitPromise = loadData().then((d) => {
    storeData = d;
    storeLoaded = true;
    notify();
  });
  return storeInitPromise;
}

async function persistStore(newData: QuickLinksData) {
  storeData = newData;
  await saveData(newData);
  notify();
}

export function useQuickLinks() {
  const [data, setData] = useState<QuickLinksData>(storeData);
  const [isLoading, setIsLoading] = useState(!storeLoaded);

  useEffect(() => {
    const listener = () => {
      setData(storeData);
      setIsLoading(false);
    };
    listeners.add(listener);
    initStore();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const addItem = useCallback(async (item: QuickLink, parentId?: string) => {
    const newData = structuredClone(storeData);
    if (parentId) {
      const parent = findItemById(newData.items, parentId);
      if (parent?.isContainer) {
        if (!parent.children) parent.children = [];
        parent.children.push(item);
      }
    } else {
      newData.items.push(item);
    }
    await persistStore(newData);
  }, []);

  const updateItem = useCallback(async (id: string, replacement: QuickLink) => {
    const newData = structuredClone(storeData);
    const { items: parentItems, index } = findItemLocation(newData.items, id);
    if (parentItems && index !== -1) {
      // Full replacement — caller provides complete object
      parentItems[index] = replacement;
    }
    await persistStore(newData);
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const newData = structuredClone(storeData);
    removeItemById(newData.items, id);
    await persistStore(newData);
  }, []);

  const recordUse = useCallback(async (id: string) => {
    const newData = structuredClone(storeData);
    const item = findItemById(newData.items, id);
    if (item) {
      item.useCount = (item.useCount ?? 0) + 1;
      item.lastUsedAt = Date.now();
    }
    await persistStore(newData);
  }, []);

  const moveItemTo = useCallback(async (itemId: string, targetContainerId: string | null) => {
    const newData = structuredClone(storeData);

    // Find and remove from current location
    const { items: sourceList, index } = findItemLocation(newData.items, itemId);
    if (!sourceList || index === -1) return;
    const [item] = sourceList.splice(index, 1);

    // Insert into target
    if (targetContainerId === null) {
      newData.items.push(item);
    } else {
      const target = findItemById(newData.items, targetContainerId);
      if (!target?.isContainer) {
        // Target gone — abort without persisting
        return;
      }
      if (!target.children) target.children = [];
      target.children.push(item);
    }

    await persistStore(newData);
  }, []);

  const getContainerTargets = useCallback(
    (excludeId?: string): ContainerTarget[] => {
      const targets: ContainerTarget[] = [{ id: null, name: "Root", path: "Root" }];
      collectContainers(data.items, [], targets, excludeId);
      return targets;
    },
    [data],
  );

  return {
    data,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    recordUse,
    moveItemTo,
    getContainerTargets,
  };
}

/** Sort items: most used first, then alphabetically for equal usage */
export function sortItems(items: QuickLink[]): QuickLink[] {
  return [...items].sort((a, b) => {
    const aCount = a.useCount ?? 0;
    const bCount = b.useCount ?? 0;
    if (aCount !== bCount) return bCount - aCount; // most used first
    return a.name.localeCompare(b.name); // alphabetical tiebreaker
  });
}

export function resolveItemsAtPath(items: QuickLink[], breadcrumb: BreadcrumbPath): QuickLink[] {
  let current = items;
  for (const entry of breadcrumb) {
    const found = current.find((item) => item.id === entry.id);
    if (found?.isContainer && found.children) {
      current = found.children;
    } else {
      return [];
    }
  }
  return current;
}

function collectContainers(items: QuickLink[], pathParts: string[], targets: ContainerTarget[], excludeId?: string) {
  for (const item of items) {
    if (!item.isContainer || item.id === excludeId) continue;
    const currentPath = [...pathParts, item.name];
    targets.push({
      id: item.id,
      name: item.name,
      path: currentPath.join(" › "),
    });
    if (item.children) {
      collectContainers(item.children, currentPath, targets, excludeId);
    }
  }
}

function findItemById(items: QuickLink[], id: string): QuickLink | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.isContainer && item.children) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function findItemLocation(items: QuickLink[], id: string): { items: QuickLink[] | null; index: number } {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === id) return { items, index: i };
    if (items[i].isContainer && items[i].children) {
      const result = findItemLocation(items[i].children!, id);
      if (result.items) return result;
    }
  }
  return { items: null, index: -1 };
}

function removeItemById(items: QuickLink[], id: string): boolean {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === id) {
      items.splice(i, 1);
      return true;
    }
    if (items[i].isContainer && items[i].children) {
      if (removeItemById(items[i].children!, id)) return true;
    }
  }
  return false;
}
