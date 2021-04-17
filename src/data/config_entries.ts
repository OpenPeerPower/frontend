import { OpenPeerPower } from "../types";

export interface ConfigEntry {
  entry_id: string;
  domain: string;
  title: string;
  source: string;
  state:
    | "loaded"
    | "setup_error"
    | "migration_error"
    | "setup_retry"
    | "not_loaded"
    | "failed_unload";
  connection_class: string;
  supports_options: boolean;
  supports_unload: boolean;
  disabled_by: "user" | null;
}

export interface ConfigEntryMutableParams {
  title: string;
}

export interface ConfigEntrySystemOptions {
  disable_new_entities: boolean;
}

export const getConfigEntries = (opp: OpenPeerPower) =>
  opp.callApi<ConfigEntry[]>("GET", "config/config_entries/entry");

export const updateConfigEntry = (
  opp: OpenPeerPower,
  configEntryId: string,
  updatedValues: Partial<ConfigEntryMutableParams>
) =>
  opp.callWS<ConfigEntry>({
    type: "config_entries/update",
    entry_id: configEntryId,
    ...updatedValues,
  });

export const deleteConfigEntry = (opp: OpenPeerPower, configEntryId: string) =>
  opp.callApi<{
    require_restart: boolean;
  }>("DELETE", `config/config_entries/entry/${configEntryId}`);

export const reloadConfigEntry = (opp: OpenPeerPower, configEntryId: string) =>
  opp.callApi<{
    require_restart: boolean;
  }>("POST", `config/config_entries/entry/${configEntryId}/reload`);

export const disableConfigEntry = (opp: OpenPeerPower, configEntryId: string) =>
  opp.callWS<{
    require_restart: boolean;
  }>({
    type: "config_entries/disable",
    entry_id: configEntryId,
    disabled_by: "user",
  });

export const enableConfigEntry = (opp: OpenPeerPower, configEntryId: string) =>
  opp.callWS<{
    require_restart: boolean;
  }>({
    type: "config_entries/disable",
    entry_id: configEntryId,
    disabled_by: null,
  });

export const getConfigEntrySystemOptions = (
  opp: OpenPeerPower,
  configEntryId: string
) =>
  opp.callWS<ConfigEntrySystemOptions>({
    type: "config_entries/system_options/list",
    entry_id: configEntryId,
  });

export const updateConfigEntrySystemOptions = (
  opp: OpenPeerPower,
  configEntryId: string,
  params: Partial<ConfigEntrySystemOptions>
) =>
  opp.callWS({
    type: "config_entries/system_options/update",
    entry_id: configEntryId,
    ...params,
  });
