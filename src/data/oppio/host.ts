import { atLeastVersion } from "../../common/config/version";
import { OpenPeerPower } from "../../types";
import { oppioApiResultExtractor, OppioResponse } from "./common";

export type OppioHostInfo = {
  coppis: string;
  cpe: string;
  deployment: string;
  disk_life_time: number | "";
  disk_free: number;
  disk_total: number;
  disk_used: number;
  features: string[];
  hostname: string;
  kernel: string;
  operating_system: string;
};

export interface OppioOppOSInfo {
  board: string | null;
  boot: string | null;
  update_available: boolean;
  version_latest: string | null;
  version: string | null;
}

export const fetchOppioHostInfo = async (
  opp: OpenPeerPower
): Promise<OppioHostInfo> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: "/host/info",
      method: "get",
    });
  }

  const response = await opp.callApi<OppioResponse<OppioHostInfo>>(
    "GET",
    "oppio/host/info"
  );
  return oppioApiResultExtractor(response);
};

export const fetchOppioOppOsInfo = async (
  opp: OpenPeerPower
): Promise<OppioOppOSInfo> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: "/os/info",
      method: "get",
    });
  }

  return oppioApiResultExtractor(
    await opp.callApi<OppioResponse<OppioOppOSInfo>>("GET", "oppio/os/info")
  );
};

export const rebootHost = async (opp: OpenPeerPower) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: "/host/reboot",
      method: "post",
      timeout: null,
    });
  }

  return opp.callApi<OppioResponse<void>>("POST", "oppio/host/reboot");
};

export const shutdownHost = async (opp: OpenPeerPower) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: "/host/shutdown",
      method: "post",
      timeout: null,
    });
  }

  return opp.callApi<OppioResponse<void>>("POST", "oppio/host/shutdown");
};

export const updateOS = async (opp: OpenPeerPower) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: "/os/update",
      method: "post",
      timeout: null,
    });
  }

  return opp.callApi<OppioResponse<void>>("POST", "oppio/os/update");
};

export const configSyncOS = async (opp: OpenPeerPower) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: "/os/config/sync",
      method: "post",
      timeout: null,
    });
  }

  return opp.callApi<OppioResponse<void>>("POST", "oppio/os/config/sync");
};

export const changeHostOptions = async (opp: OpenPeerPower, options: any) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: "/host/options",
      method: "post",
      data: options,
    });
  }

  return opp.callApi<OppioResponse<void>>(
    "POST",
    "oppio/host/options",
    options
  );
};
