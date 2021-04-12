import { OpenPeerPower } from "../types";

export interface AnalyticsPreferences {
  base?: boolean;
  diagnostics?: boolean;
  usage?: boolean;
  statistics?: boolean;
}

export interface Analytics {
  preferences: AnalyticsPreferences;
}

export const getAnalyticsDetails = (opp: OpenPeerPower) =>
  opp.callWS<Analytics>({
    type: "analytics",
  });

export const setAnalyticsPreferences = (
  opp: OpenPeerPower,
  preferences: AnalyticsPreferences
) =>
  opp.callWS<AnalyticsPreferences>({
    type: "analytics/preferences",
    preferences,
  });
