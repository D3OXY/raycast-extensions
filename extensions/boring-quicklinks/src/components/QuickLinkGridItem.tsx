import {
  Action,
  ActionPanel,
  confirmAlert,
  Alert,
  Icon,
  Grid,
  showToast,
  Toast,
} from "@raycast/api";
import { QuickLink, BreadcrumbPath } from "../utils/types";
import { resolveIcon, isUrl } from "../utils/icons";
import { useQuickLinks } from "../hooks/useQuickLinks";
import { LinkForm } from "./LinkForm";
import { QuickLinksGrid } from "./QuickLinksGrid";
import { SHORTCUTS } from "../utils/constants";

export function QuickLinkGridItem({
  item,
  breadcrumb,
  nested,
}: {
  item: QuickLink;
  breadcrumb: BreadcrumbPath;
  nested?: boolean;
}) {
  const { deleteItem, recordUse, moveItemTo, getContainerTargets } =
    useQuickLinks();
  const childCount = item.children?.length ?? 0;

  // Include parent container names as keywords so "git neuro" finds "Neurofactor" inside "GitHub"
  const parentKeywords = nested ? breadcrumb.map((b) => b.name) : [];
  const allKeywords = [...(item.keywords ?? []), ...parentKeywords];

  function openAction() {
    if (!item.url) return null;
    return isUrl(item.url) ? (
      <Action.OpenInBrowser url={item.url} onOpen={() => recordUse(item.id)} />
    ) : (
      <Action.Open
        title="Open Link"
        target={item.url}
        onOpen={() => recordUse(item.id)}
      />
    );
  }

  function primaryAction() {
    if (item.isContainer) {
      const newBreadcrumb: BreadcrumbPath = [
        ...breadcrumb,
        { id: item.id, name: item.name },
      ];
      return (
        <Action.Push
          icon={Icon.ArrowRight}
          title="Open Container"
          target={<QuickLinksGrid breadcrumb={newBreadcrumb} />}
        />
      );
    }
    return openAction();
  }

  function secondaryOpenAction() {
    if (!item.isContainer || !item.url) return null;
    return isUrl(item.url) ? (
      <Action.OpenInBrowser
        url={item.url}
        title="Open Link"
        shortcut={SHORTCUTS.openRootLink}
        onOpen={() => recordUse(item.id)}
      />
    ) : (
      <Action.Open
        title="Open Link"
        target={item.url}
        shortcut={SHORTCUTS.openRootLink}
        onOpen={() => recordUse(item.id)}
      />
    );
  }

  function moveToSubmenu() {
    const targets = getContainerTargets(item.id);
    // Find where the item currently lives
    const currentParentId =
      breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : null;

    return (
      <ActionPanel.Submenu
        icon={Icon.ArrowRightCircle}
        title="Move To…"
        shortcut={SHORTCUTS.moveTo}
      >
        {targets
          .filter((t) => t.id !== currentParentId)
          .map((target) => (
            <Action
              key={target.id ?? "__root"}
              icon={target.id === null ? Icon.House : Icon.Folder}
              title={target.path}
              onAction={async () => {
                await moveItemTo(item.id, target.id);
                await showToast({
                  style: Toast.Style.Success,
                  title: `Moved to ${target.path}`,
                });
              }}
            />
          ))}
      </ActionPanel.Submenu>
    );
  }

  return (
    <Grid.Item
      id={item.id}
      content={resolveIcon(item)}
      title={item.name}
      subtitle={
        nested
          ? breadcrumb.map((b) => b.name).join(" › ")
          : item.isContainer
            ? `${childCount} item${childCount !== 1 ? "s" : ""}`
            : undefined
      }
      keywords={allKeywords.length > 0 ? allKeywords : undefined}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            {primaryAction()}
            {secondaryOpenAction()}
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.Push
              icon={Icon.Pencil}
              title="Edit Quick Link"
              shortcut={SHORTCUTS.edit}
              target={<LinkForm existingLink={item} />}
            />
            {item.isContainer && (
              <Action.Push
                icon={Icon.Plus}
                title="Add Link Inside"
                shortcut={SHORTCUTS.addLink}
                target={<LinkForm parentId={item.id} />}
              />
            )}
            {moveToSubmenu()}
            <Action
              icon={Icon.Trash}
              title="Delete Quick Link"
              style={Action.Style.Destructive}
              shortcut={SHORTCUTS.delete}
              onAction={async () => {
                const msg =
                  item.isContainer && childCount > 0
                    ? `This container has ${childCount} item${childCount !== 1 ? "s" : ""}. Delete all?`
                    : "This cannot be undone.";
                if (
                  await confirmAlert({
                    title: `Delete "${item.name}"?`,
                    message: msg,
                    primaryAction: {
                      title: "Delete",
                      style: Alert.ActionStyle.Destructive,
                    },
                  })
                ) {
                  await deleteItem(item.id);
                }
              }}
            />
          </ActionPanel.Section>
          {item.url && (
            <ActionPanel.Section>
              <Action.CopyToClipboard
                title="Copy URL"
                content={item.url}
                shortcut={SHORTCUTS.copyUrl}
              />
            </ActionPanel.Section>
          )}
        </ActionPanel>
      }
    />
  );
}
