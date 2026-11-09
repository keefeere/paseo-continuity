import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { usePaseo } from '@getpaseo/plugin/client';
import type { PluginTheme } from "@getpaseo/plugin";
import type { ChainEntry } from "../shared/settings";
import { providerBadge } from '../shared/labels';
import { SettingsRow, SettingsSelect, SettingsSwitch } from '@getpaseo/plugin/client/ui';

interface ChainEditorProps {
  chain: ChainEntry[];
  onChainChange: (chain: ChainEntry[]) => void;
  theme: PluginTheme;
}

export function ChainEditor({ chain, onChainChange, theme }: ChainEditorProps) {
  const paseo = usePaseo();

  const { data: snapshotResult, isLoading, error } = useQuery({
    queryKey: ['paseo-providers-snapshot'],
    queryFn: async () => await paseo.providers.snapshot(),
  });

  const displayItems = useMemo(() => {
    const entries = snapshotResult?.entries || [];
    const readyEntries = entries.filter(e => e.enabled && e.status === 'ready');
    const entriesByProvider = new Map(entries.map(e => [e.provider, e]));

    const chainItems = chain.map((chainEntry, idx) => {
      const snapshotEntry = entriesByProvider.get(chainEntry.provider);
      return {
        provider: chainEntry.provider,
        chainEntry,
        snapshotEntry,
        inChain: true,
        chainIndex: idx,
        label: snapshotEntry?.label ?? chainEntry.provider,
        isUnknown: !snapshotEntry
      };
    });

    const chainProviderSet = new Set(chain.map(c => c.provider));
    const nonChainItems = readyEntries
      .filter(e => !chainProviderSet.has(e.provider))
      .map(e => ({
        provider: e.provider,
        chainEntry: null,
        snapshotEntry: e,
        inChain: false,
        chainIndex: null,
        label: e.label ?? e.provider,
        isUnknown: false
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return [...chainItems, ...nonChainItems];
  }, [chain, snapshotResult]);

  const handleToggle = (provider: string, inChain: boolean) => {
    if (inChain) {
      onChainChange(chain.filter(c => c.provider !== provider));
    } else {
      onChainChange([...chain, { provider, model: null, modeId: null, thinkingOptionId: null }]);
    }
  };

  const handleMoveTo = (from: number, to: number) => {
    if (from === to || to < 0 || to >= chain.length) return;
    const next = [...chain];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    onChainChange(next);
  };

  const handlePatch = (index: number, patch: Partial<ChainEntry>) => {
    const newChain = [...chain];
    newChain[index] = { ...newChain[index]!, ...patch };
    onChainChange(newChain);
  };

  const muted = { color: theme.colors.foregroundMuted, fontSize: 13 } as const;

  if (isLoading) {
    return (
      <SettingsRow label="Providers">
        <Text style={muted}>Loading…</Text>
      </SettingsRow>
    );
  }

  if (error) {
    return (
      <SettingsRow label="Providers">
        <Text style={{ color: theme.colors.statusDanger, fontSize: 13 }}>Failed to load providers.</Text>
      </SettingsRow>
    );
  }

  // Only host settings components are used: the host fixes the height of custom
  // content, so anything that expands inline (lists, dropdowns) is painted over
  // the rows below it.
  return (
    <>
      {chain.length < 2 && (
        <SettingsRow label="Warning" hint="A fallback chain should ideally have at least 2 providers for continuity." />
      )}
      {displayItems.length === 0 && <SettingsRow label="No providers available" />}
      {displayItems.map((item) => {
        const models = (item.snapshotEntry?.models ?? []).filter((m: any) => m.isSelectable !== false);
        const modes = item.snapshotEntry?.modes ?? [];
        const badge = providerBadge(item.provider, item.chainEntry?.model);
        const index = item.chainIndex;
        return (
          <React.Fragment key={item.provider}>
            <SettingsSwitch
              label={`${badge.badge} ${item.label}`}
              hint={item.isUnknown ? 'Unknown or unavailable provider' : undefined}
              value={item.inChain}
              onValueChange={() => handleToggle(item.provider, item.inChain)}
            />
            {item.inChain && index !== null && (
              <>
                <SettingsSelect
                  label="Position in chain"
                  value={String(index + 1)}
                  options={chain.map((_, i) => ({ label: String(i + 1), value: String(i + 1) }))}
                  onValueChange={(v: string) => handleMoveTo(index, Number(v) - 1)}
                />
                {models.length > 1 && (
                  <SettingsSelect
                    label="Model"
                    value={item.chainEntry?.model ?? ''}
                    options={[
                      { label: 'Default model', value: '' },
                      ...models.map((m: any) => ({ label: (m.label ?? m.id) as string, value: m.id as string })),
                    ]}
                    onValueChange={(v: string) => handlePatch(index, { model: v || null })}
                  />
                )}
                {modes.length > 1 && (
                  <SettingsSelect
                    label="Mode"
                    value={item.chainEntry?.modeId ?? ''}
                    options={[
                      { label: 'Default mode', value: '' },
                      ...modes.map((m: any) => ({ label: (m.label ?? m.id) as string, value: m.id as string })),
                    ]}
                    onValueChange={(v: string) => handlePatch(index, { modeId: v || null })}
                  />
                )}
              </>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}
