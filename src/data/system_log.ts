import { OpenPeerPower } from "../types";

export interface LoggedError {
  name: string;
  message: [string];
  level: string;
  source: [string, number];
  // unix timestamp in seconds
  timestamp: number;
  exception: string;
  count: number;
  // unix timestamp in seconds
  first_occurred: number;
}

export const fetchSystemLog = (opp: OpenPeerPower) =>
  opp.callApi<LoggedError[]>("GET", "error/all");

export const getLoggedErrorIntegration = (item: LoggedError) => {
  // Try to derive from logger name
  if (item.name.startsWith("openpeerpower.components.")) {
    return item.name.split(".")[2];
  }
  if (item.name.startsWith("custom_components.")) {
    return item.name.split(".")[1];
  }

  // Try to derive from logged location
  if (item.source[0].startsWith("custom_components/")) {
    return item.source[0].split("/")[1];
  }

  if (item.source[0].startsWith("openpeerpower/components/")) {
    return item.source[0].split("/")[2];
  }

  return undefined;
};

export const isCustomIntegrationError = (item: LoggedError) =>
  item.name.startsWith("custom_components.") ||
  item.source[0].startsWith("custom_components/");
