import { ActionPanel, Action, Grid, Icon } from "@raycast/api";
import { useState, useMemo } from "react";
import { BreadcrumbPath, QuickLink } from "../utils/types";
import { useQuickLinks, resolveItemsAtPath, sortItems } from "../hooks/useQuickLinks";
import { GRID_COLUMNS, GRID_ASPECT_RATIO, GRID_INSET } from "../utils/constants";
import { QuickLinkGridItem } from "./QuickLinkGridItem";
import { LinkForm } from "./LinkForm";
import { EmptyView } from "./EmptyView";

interface FlatItem {
  item: QuickLink;
  breadcrumb: BreadcrumbPath;
  depth: number;
  searchText: string; // pre-computed: item name + parent names + keywords
}

function flattenItems(items: QuickLink[], parentBreadcrumb: BreadcrumbPath, depth: number): FlatItem[] {
  const result: FlatItem[] = [];
  for (const item of items) {
    const parentNames = parentBreadcrumb.map((b) => b.name);
    const searchParts = [item.name, ...parentNames, ...(item.keywords ?? [])];
    result.push({
      item,
      breadcrumb: parentBreadcrumb,
      depth,
      searchText: searchParts.join(" ").toLowerCase(),
    });
    if (item.isContainer && item.children) {
      const childBreadcrumb: BreadcrumbPath = [...parentBreadcrumb, { id: item.id, name: item.name }];
      result.push(...flattenItems(item.children, childBreadcrumb, depth + 1));
    }
  }
  return result;
}

function matchesSearch(searchText: string, query: string): boolean {
  if (!query) return true;
  // Every word in the query must match somewhere in the search text
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((word) => searchText.includes(word));
}

export function QuickLinksGrid({ breadcrumb, initialSearch }: { breadcrumb: BreadcrumbPath; initialSearch?: string }) {
  const { data, isLoading } = useQuickLinks();
  const [search, setSearch] = useState(initialSearch ?? "");
  const isRoot = breadcrumb.length === 0;
  const parentId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : undefined;
  const navTitle = breadcrumb.length > 0 ? breadcrumb.map((b) => b.name).join(" › ") : undefined;

  const allFlat = useMemo(() => {
    const items = isRoot ? data.items : resolveItemsAtPath(data.items, breadcrumb);
    return flattenItems(items, breadcrumb, 0);
  }, [data, breadcrumb, isRoot]);

  const filtered = useMemo(() => {
    if (!search) {
      // No search: show current level items only (not nested)
      const currentLevel = allFlat.filter((f) => f.depth === 0);
      return {
        main: sortItems(currentLevel.map((f) => f.item)),
        nested: [] as FlatItem[],
      };
    }

    // Search: show all matching items, top-level first, then nested
    const matching = allFlat.filter((f) => matchesSearch(f.searchText, search));
    const topLevel = matching.filter((f) => f.depth === 0);
    const nested = matching.filter((f) => f.depth > 0);

    return {
      main: sortItems(topLevel.map((f) => f.item)),
      nested: nested.sort((a, b) => {
        // Sort nested by frecency then alphabetically
        const aCount = a.item.useCount ?? 0;
        const bCount = b.item.useCount ?? 0;
        if (aCount !== bCount) return bCount - aCount;
        return a.item.name.localeCompare(b.item.name);
      }),
    };
  }, [allFlat, search]);

  return (
    <Grid
      columns={GRID_COLUMNS}
      aspectRatio={GRID_ASPECT_RATIO}
      inset={GRID_INSET}
      filtering={false}
      onSearchTextChange={setSearch}
      searchText={search}
      navigationTitle={navTitle}
      searchBarPlaceholder="Search quick links..."
      isLoading={isLoading}
    >
      <EmptyView breadcrumb={breadcrumb} />
      {filtered.main.map((item) => (
        <QuickLinkGridItem key={item.id} item={item} breadcrumb={breadcrumb} />
      ))}
      {filtered.nested.length > 0 && (
        <Grid.Section title="Nested">
          {filtered.nested.map((flat) => (
            <QuickLinkGridItem key={flat.item.id} item={flat.item} breadcrumb={flat.breadcrumb} nested />
          ))}
        </Grid.Section>
      )}
      {!isLoading && (filtered.main.length > 0 || filtered.nested.length > 0) && (
        <Grid.Section title="">
          <Grid.Item
            id="__add_link"
            content={Icon.Plus}
            title="Add Quick Link"
            actions={
              <ActionPanel>
                <Action.Push icon={Icon.Plus} title="Add Quick Link" target={<LinkForm parentId={parentId} />} />
              </ActionPanel>
            }
          />
        </Grid.Section>
      )}
    </Grid>
  );
}
