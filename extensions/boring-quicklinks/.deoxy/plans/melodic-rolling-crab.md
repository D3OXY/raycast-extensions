# Boring Quick Links — Raycast Extension

## Context
Build a Raycast extension with an emoji-picker-style grid UI for managing quicklinks (URLs, files, folders, apps). Improves on Raycast's built-in quicklinks by adding **nested containers** — groups of related links that can be drilled into infinitely. The mockup shows a 5-column grid of rounded-square items with icons and labels.

## Data Model (`src/utils/types.ts`)

Discriminated union on `type` field:

```typescript
interface BaseItem {
  id: string;             // crypto.randomUUID()
  name: string;
  icon?: ItemIcon;
  keywords?: string[];
  sortOrder: number;
}

interface QuickLink extends BaseItem {
  type: "link";
  url: string;            // URL, file path, or app path
  openWith?: string;      // app bundle ID
}

interface Container extends BaseItem {
  type: "container";
  rootLink?: string;      // optional URL for Cmd+Enter
  children: QuickLinkItem[];
}

type QuickLinkItem = QuickLink | Container;

type ItemIcon =
  | { type: "emoji"; value: string }
  | { type: "raycast"; value: string }
  | { type: "favicon"; value: string }
  | { type: "url"; value: string };

interface QuickLinksData {
  version: 1;
  items: QuickLinkItem[];
}
```

Children are inline (not ID-referenced) — simple for our scale.

## File Structure

```
boring-quicklinks/
├── package.json
├── tsconfig.json
├── assets/
│   └── command-icon.png
├── src/
│   ├── browse-quicklinks.tsx       # Main command: grid entry point + context provider
│   ├── add-link.tsx                # Standalone "Add Link" command
│   ├── add-container.tsx           # Standalone "Add Container" command
│   ├── import-export.tsx           # Import/Export command
│   ├── components/
│   │   ├── QuickLinksGrid.tsx      # Reusable grid (root + nested containers)
│   │   ├── LinkGridItem.tsx        # Grid.Item for links
│   │   ├── ContainerGridItem.tsx   # Grid.Item for containers
│   │   ├── LinkForm.tsx            # Create/edit link form
│   │   ├── ContainerForm.tsx       # Create/edit container form
│   │   └── EmptyView.tsx           # Empty state
│   ├── hooks/
│   │   └── useQuickLinks.ts        # Data hook + React context + CRUD
│   ├── storage/
│   │   └── storage.ts              # JSON file read/write (atomic)
│   └── utils/
│       ├── types.ts
│       ├── icons.ts                # Icon resolution + getFavicon from @raycast/utils
│       └── constants.ts            # Grid columns=5, shortcuts
```

## Core Architecture

### Storage (`src/storage/storage.ts`)
- JSON file at `environment.supportPath + "/quicklinks.json"`
- Atomic writes: write `.tmp` then `fs.rename`
- Functions: `loadData()`, `saveData()`, `exportData()`, `importData()`

### State Management (`src/hooks/useQuickLinks.ts`)
- React context (`QuickLinksContext`) wraps root command
- All pushed grid views share context → mutations at any depth re-render everywhere
- CRUD: `addItem(item, parentId?)`, `updateItem(id, updates)`, `deleteItem(id)`, `moveItem(id, "up"|"down")`
- Helper: `resolveItemsAtPath(allItems, breadcrumbPath)` to get items at current navigation level

### Grid Component (`src/components/QuickLinksGrid.tsx`)
- `<Grid columns={5} aspectRatio="1" inset={Grid.Inset.Small} filtering={true}>`
- Reads items from context by traversing breadcrumb path
- Renders `LinkGridItem` or `ContainerGridItem` based on `item.type`
- `navigationTitle` shows breadcrumb: `"Quick Links > GitHub > Repos"`

### Navigation
- **Container → Enter**: `Action.Push` pushes new `<QuickLinksGrid>` with updated breadcrumb
- **Container → Cmd+Enter**: `Action.OpenInBrowser` opens `rootLink` (if set)
- **Link → Enter**: `Action.OpenInBrowser` or `Action.Open` depending on URL vs file path
- **Esc**: Raycast automatically pops back to parent

### Icon Resolution (`src/utils/icons.ts`)
- Uses `getFavicon()` from `@raycast/utils` for URL-based links (auto favicon)
- Emoji strings passed directly (Raycast accepts them as `Image.ImageLike`)
- Raycast `Icon[name]` for built-in icons
- Fallbacks: Container → `Icon.Folder`, URL → favicon, file → `Icon.Document`

## Keyboard Shortcuts

| Context | Key | Action |
|---|---|---|
| Link | Enter | Open link |
| Link | Cmd+E | Edit |
| Link | Ctrl+X | Delete (with confirm) |
| Link | Cmd+Shift+C | Copy URL |
| Container | Enter | Drill into |
| Container | Cmd+Enter | Open root link |
| Container | Cmd+E | Edit |
| Container | Cmd+N | Add link inside |
| Container | Ctrl+X | Delete (with confirm) |
| Any | Cmd+N | Add link at current level |
| Any | Cmd+Shift+N | Add container at current level |
| Any | Cmd+Opt+↑/↓ | Reorder |

## package.json Commands

- `browse` — "Browse Quick Links" (main grid view)
- `add-link` — "Add Quick Link" (standalone form)
- `add-container` — "Add Container" (standalone form)
- `import-export` — "Import / Export Quick Links"

Dependencies: `@raycast/api ^1.83.0`, `@raycast/utils ^1.17.0`

## Implementation Phases

### Phase 1: Foundation
1. Scaffold project (`package.json`, `tsconfig.json`, directory structure) — use **pnpm** as package manager
2. `types.ts` — all interfaces
3. `constants.ts` — grid config
4. `storage.ts` — load/save with atomic writes
5. `icons.ts` — icon resolution

### Phase 2: Core Grid
6. `useQuickLinks.ts` — hook + context
7. `EmptyView.tsx`
8. `LinkGridItem.tsx` — open action
9. `ContainerGridItem.tsx` — drill-in + open root link
10. `QuickLinksGrid.tsx` — compose grid
11. `browse-quicklinks.tsx` — entry point

### Phase 3: CRUD
12. `LinkForm.tsx` — create/edit
13. `ContainerForm.tsx` — create/edit
14. Wire add/edit/delete actions into grid items
15. `add-link.tsx` + `add-container.tsx` standalone commands
16. Delete confirmation dialogs

### Phase 4: Polish
17. Reordering (move up/down)
18. `import-export.tsx`
19. Edge cases (empty states, corrupt data, deep nesting)
20. Test end-to-end

## Verification
1. `pnpm dev` — launches extension in Raycast dev mode
2. Add a few links → verify they appear in grid with favicons
3. Create a container with children → Enter drills in, Esc pops back
4. Set rootLink on container → Cmd+Enter opens it
5. Edit/delete items → verify persistence across Raycast restarts
6. Export → clear data → import → verify restore
7. Test 3+ levels of nesting
8. Test search filtering across titles and keywords
