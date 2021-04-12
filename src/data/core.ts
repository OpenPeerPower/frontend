import { OppConfig } from "open-peer-power-js-websocket";
import { OpenPeerPower } from "../types";

export interface ConfigUpdateValues {
  location_name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  unit_system: "metric" | "imperial";
  time_zone: string;
  external_url?: string | null;
  internal_url?: string | null;
}

export interface CheckConfigResult {
  result: "valid" | "invalid";
  errors: string | null;
}

export const saveCoreConfig = (
  opp: OpenPeerPower,
  values: Partial<ConfigUpdateValues>
) =>
  opp.callWS<OppConfig>({
    type: "config/core/update",
    ...values,
  });

export const detectCoreConfig = (opp: OpenPeerPower) =>
  opp.callWS<Partial<ConfigUpdateValues>>({
    type: "config/core/detect",
  });

export const checkCoreConfig = (opp: OpenPeerPower) =>
  opp.callApi<CheckConfigResult>("POST", "config/core/check_config");
