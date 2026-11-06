import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { PluginTheme } from "@getpaseo/plugin";

export interface DropdownOption {
  value: string | null;
  label: string;
}

interface DropdownProps {
  options: readonly DropdownOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  theme: PluginTheme;
  /** Shown when `value` matches no option. */
  fallbackLabel?: string;
}

const ROW_HEIGHT = 32;
const MAX_LIST_HEIGHT = 224;

/** Inline dropdown; shows a filter box once the list is long enough to need one. */
export function Dropdown({ options, value, onChange, theme, fallbackLabel }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = options.find((option) => option.value === value)?.label ?? value ?? fallbackLabel ?? "Default";
  const searchable = options.length > 8;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (option) => option.label.toLowerCase().includes(needle) || option.value?.toLowerCase().includes(needle),
    );
  }, [options, query]);

  // Explicit height: a bare maxHeight collapses inside Paseo's settings card.
  const listHeight = Math.min(MAX_LIST_HEIGHT, Math.max(visible.length, 1) * ROW_HEIGHT);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <View style={{ minWidth: open ? 220 : 160, flexShrink: 0 }}>
      <Pressable
        accessibilityRole="button"
        onPress={() => (open ? close() : setOpen(true))}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          backgroundColor: theme.colors.surface2,
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Text style={{ color: theme.colors.foreground, fontSize: 12, flexShrink: 1 }} numberOfLines={1}>
          {current}
        </Text>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>{open ? "▴" : "▾"}</Text>
      </Pressable>
      {open ? (
        <View
          style={{
            marginTop: 4,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 6,
            backgroundColor: theme.colors.surface1,
          }}
        >
          {searchable ? (
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder={`Filter ${options.length} options…`}
              placeholderTextColor={theme.colors.foregroundMuted}
              style={{ color: theme.colors.foreground, fontSize: 12, padding: 8 }}
            />
          ) : null}
          <ScrollView
            nestedScrollEnabled
            style={{ height: listHeight, flexGrow: 0, flexShrink: 0 }}
            keyboardShouldPersistTaps="handled"
          >
            {visible.length === 0 ? (
              <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12, height: ROW_HEIGHT, paddingHorizontal: 8, textAlignVertical: "center" }}>No matches</Text>
            ) : (
              visible.map((option) => (
                <Pressable
                  key={option.value ?? "__default"}
                  onPress={() => {
                    onChange(option.value);
                    close();
                  }}
                  style={{
                    height: ROW_HEIGHT,
                    paddingHorizontal: 8,
                    justifyContent: "center",
                    backgroundColor: option.value === value ? theme.colors.surface2 : "transparent",
                  }}
                >
                  <Text style={{ color: theme.colors.foreground, fontSize: 12 }}>{option.label}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
