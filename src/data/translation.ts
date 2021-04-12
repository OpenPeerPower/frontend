import { OpenPeerPower } from "../types";
import { fetchFrontendUserData, saveFrontendUserData } from "./frontend";

export enum NumberFormat {
  language = "language",
  system = "system",
  comma_decimal = "comma_decimal",
  decimal_comma = "decimal_comma",
  space_comma = "space_comma",
  none = "none",
}

export interface FrontendTranslationData {
  language: string;
  number_format: NumberFormat;
}

declare global {
  interface FrontendUserData {
    language: FrontendTranslationData;
  }
}

export type TranslationCategory =
  | "title"
  | "state"
  | "config"
  | "options"
  | "device_automation"
  | "mfa_setup"
  | "system_health";

export const fetchTranslationPreferences = (opp: OpenPeerPower) =>
  fetchFrontendUserData(opp.connection, "language");

export const saveTranslationPreferences = (
  opp: OpenPeerPower,
  data: FrontendTranslationData
) => saveFrontendUserData(opp.connection, "language", data);

export const getOppTranslations = async (
  opp: OpenPeerPower,
  language: string,
  category: TranslationCategory,
  integration?: string,
  config_flow?: boolean
): Promise<Record<string, unknown>> => {
  const result = await opp.callWS<{ resources: Record<string, unknown> }>({
    type: "frontend/get_translations",
    language,
    category,
    integration,
    config_flow,
  });
  return result.resources;
};

export const getOppTranslationsPre109 = async (
  opp: OpenPeerPower,
  language: string
): Promise<Record<string, unknown>> => {
  const result = await opp.callWS<{ resources: Record<string, unknown> }>({
    type: "frontend/get_translations",
    language,
  });
  return result.resources;
};
