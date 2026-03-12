import { Action, ActionPanel, Clipboard, Icon, List, showToast, Toast, confirmAlert, Alert } from "@raycast/api";
import { exportData, importData } from "./storage/storage";

export default function ImportExport() {
  return (
    <List>
      <List.Item
        icon={Icon.Upload}
        title="Export to Clipboard"
        subtitle="Copy all quick links as JSON"
        actions={
          <ActionPanel>
            <Action
              icon={Icon.Upload}
              title="Export to Clipboard"
              onAction={async () => {
                const json = await exportData();
                await Clipboard.copy(json);
                await showToast({
                  style: Toast.Style.Success,
                  title: "Exported to clipboard",
                });
              }}
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Download}
        title="Import from Clipboard"
        subtitle="Replace all quick links with JSON from clipboard"
        actions={
          <ActionPanel>
            <Action
              icon={Icon.Download}
              title="Import from Clipboard"
              onAction={async () => {
                const confirmed = await confirmAlert({
                  title: "Import Quick Links?",
                  message: "This will replace all existing quick links with the data from your clipboard.",
                  primaryAction: {
                    title: "Import",
                    style: Alert.ActionStyle.Destructive,
                  },
                });
                if (!confirmed) return;

                try {
                  const text = await Clipboard.readText();
                  if (!text) {
                    await showToast({
                      style: Toast.Style.Failure,
                      title: "Clipboard is empty",
                    });
                    return;
                  }
                  await importData(text);
                  await showToast({
                    style: Toast.Style.Success,
                    title: "Imported successfully",
                  });
                } catch (e) {
                  await showToast({
                    style: Toast.Style.Failure,
                    title: "Import failed",
                    message: e instanceof Error ? e.message : "Invalid JSON",
                  });
                }
              }}
            />
          </ActionPanel>
        }
      />
    </List>
  );
}
