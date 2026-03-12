import { Action, ActionPanel, Alert, confirmAlert, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { randomUUID } from "crypto";
import { useState } from "react";
import { useQuickLinks } from "../hooks/useQuickLinks";
import { QuickLink, ItemIcon, ICON_COLORS } from "../utils/types";

interface LinkFormProps {
  existingLink?: QuickLink;
  parentId?: string;
}

const ICON_PLACEHOLDERS: Record<string, string> = {
  favicon: "Leave empty for auto-detect from URL",
  emoji: "🚀 or any emoji",
  raycast: "Globe, Folder, Code, Star, Heart...",
  brand: "github, twitter, figma, spotify, slack...",
  url: "https://example.com/icon.png",
};

export function LinkForm({ existingLink, parentId }: LinkFormProps) {
  const { addItem, updateItem } = useQuickLinks();
  const { pop } = useNavigation();
  const [iconType, setIconType] = useState(existingLink?.icon?.type ?? "favicon");

  async function handleSubmit(values: {
    name: string;
    url: string;
    isContainer: boolean;
    iconType: string;
    iconValue: string;
    color: string;
    keywords: string;
  }) {
    if (!values.name.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Name is required",
      });
      return;
    }
    if (!values.isContainer && !values.url.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "URL / Path is required",
      });
      return;
    }

    const icon: ItemIcon | undefined = values.iconValue.trim()
      ? {
          type: values.iconType as ItemIcon["type"],
          value: values.iconValue.trim(),
        }
      : undefined;

    const keywords = values.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    if (existingLink) {
      // Warn if unchecking container with children
      if (existingLink.isContainer && !values.isContainer) {
        const childCount = existingLink.children?.length ?? 0;
        if (childCount > 0) {
          const confirmed = await confirmAlert({
            title: `Remove container "${existingLink.name}"?`,
            message: `This will permanently delete ${childCount} item${childCount !== 1 ? "s" : ""} inside it.`,
            primaryAction: { title: "Remove Container", style: Alert.ActionStyle.Destructive },
          });
          if (!confirmed) return;
        }
      }

      // Full replacement of editable fields — preserves id, useCount, lastUsedAt, children
      const updated: QuickLink = {
        ...existingLink,
        name: values.name.trim(),
        url: values.url.trim() || undefined,
        isContainer: values.isContainer || undefined,
        children: values.isContainer ? (existingLink.children ?? []) : undefined,
        icon,
        color: values.color || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
      };
      await updateItem(existingLink.id, updated);
      await showToast({ style: Toast.Style.Success, title: "Link updated" });
    } else {
      const link: QuickLink = {
        id: randomUUID(),
        name: values.name.trim(),
        url: values.url.trim() || undefined,
        isContainer: values.isContainer || undefined,
        children: values.isContainer ? [] : undefined,
        icon,
        color: values.color || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
      };
      await addItem(link, parentId);
      await showToast({ style: Toast.Style.Success, title: "Link added" });
    }
    pop();
  }

  return (
    <Form
      navigationTitle={existingLink ? "Edit Quick Link" : "Add Quick Link"}
      actions={
        <ActionPanel>
          <Action.SubmitForm title={existingLink ? "Save" : "Add"} icon={Icon.Check} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Name" defaultValue={existingLink?.name ?? ""} placeholder="GitHub" />
      <Form.TextField
        id="url"
        title="URL / Path"
        defaultValue={existingLink?.url ?? ""}
        placeholder="https://github.com or /path/to/folder"
      />
      <Form.Checkbox
        id="isContainer"
        label="Container (group links inside)"
        defaultValue={existingLink?.isContainer ?? false}
      />
      <Form.Separator />
      <Form.Dropdown
        id="iconType"
        title="Icon Type"
        defaultValue={existingLink?.icon?.type ?? "favicon"}
        onChange={setIconType}
      >
        <Form.Dropdown.Item title="Auto (Favicon)" value="favicon" />
        <Form.Dropdown.Item title="Brand (SVG)" value="brand" icon={Icon.Star} />
        <Form.Dropdown.Item title="Emoji" value="emoji" />
        <Form.Dropdown.Item title="Raycast Icon" value="raycast" />
        <Form.Dropdown.Item title="Image URL" value="url" />
      </Form.Dropdown>
      <Form.TextField
        id="iconValue"
        title="Icon Value"
        defaultValue={existingLink?.icon?.value ?? ""}
        placeholder={ICON_PLACEHOLDERS[iconType] ?? ""}
      />
      <Form.Dropdown id="color" title="Color" defaultValue={existingLink?.color ?? ""}>
        {ICON_COLORS.map((c) => (
          <Form.Dropdown.Item
            key={c.value}
            title={c.name}
            value={c.value}
            icon={c.value ? { source: Icon.Circle, tintColor: c.value } : undefined}
          />
        ))}
      </Form.Dropdown>
      <Form.TextField
        id="keywords"
        title="Keywords"
        defaultValue={existingLink?.keywords?.join(", ") ?? ""}
        placeholder="Comma-separated (optional)"
      />
    </Form>
  );
}
