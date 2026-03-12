import { ActionPanel, Action, Grid, Icon } from "@raycast/api";
import { LinkForm } from "./LinkForm";
import { BreadcrumbPath } from "../utils/types";

export function EmptyView({ breadcrumb }: { breadcrumb: BreadcrumbPath }) {
  const parentId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : undefined;
  const isNested = breadcrumb.length > 0;

  return (
    <Grid.EmptyView
      icon={Icon.Star}
      title={isNested ? "Empty Container" : "No Quick Links Yet"}
      description={isNested ? "Add links to this container" : "Add your first quick link to get started"}
      actions={
        <ActionPanel>
          <Action.Push icon={Icon.Plus} title="Add Quick Link" target={<LinkForm parentId={parentId} />} />
        </ActionPanel>
      }
    />
  );
}
