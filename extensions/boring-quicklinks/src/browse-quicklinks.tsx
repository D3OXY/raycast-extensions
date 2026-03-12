import { LaunchProps } from "@raycast/api";
import { QuickLinksGrid } from "./components/QuickLinksGrid";

export default function BrowseQuickLinks(
  props: LaunchProps<{ arguments: { search?: string } }>,
) {
  return (
    <QuickLinksGrid breadcrumb={[]} initialSearch={props.arguments.search} />
  );
}
