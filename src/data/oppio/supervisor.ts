import { atLeastVersion } from "../../common/config/version";
import { OpenPeerPower, PanelInfo } from "../../types";
import { SupervisorArch } from "../supervisor/supervisor";
import { OppioAddonInfo, OppioAddonRepository } from "./addon";
import { oppioApiResultExtractor, OppioResponse } from "./common";

export type OppioOpenPeerPowerInfo = {
  arch: SupervisorArch;
  audio_input: string | null;
  audio_output: string | null;
  boot: boolean;
  image: string;
  ip_address: string;
  machine: string;
  port: number;
  ssl: boolean;
  update_available: boolean;
  version_latest: string;
  version: string;
  wait_boot: number;
  watchdog: boolean;
};

export type OppioSupervisorInfo = {
  addons: OppioAddonInfo[];
  addons_repositories: OppioAddonRepository[];
  arch: SupervisorArch;
  channel: string;
  debug: boolean;
  debug_block: boolean;
  diagnostics: boolean | null;
  healthy: boolean;
  ip_address: string;
  logging: string;
  supported: boolean;
  timezone: string;
  update_available: boolean;
  version: string;
  version_latest: string;
  wait_boot: number;
};

export type OppioInfo = {
  arch: SupervisorArch;
  channel: string;
  docker: string;
  features: string[];
  oppos: null;
  openpeerpower: string;
  hostname: string;
  logging: string;
  machine: string;
  state:
    | "initialize"
    | "setup"
    | "startup"
    | "running"
    | "freeze"
    | "shutdown"
    | "stopping"
    | "close";
  operating_system: string;
  supervisor: string;
  supported: boolean;
  supported_arch: SupervisorArch[];
  timezone: string;
};

export type OppioPanelInfo = PanelInfo<
  | undefined
  | {
      ingress?: string;
    }
>;

export interface CreateSessionResponse {
  session: string;
}

export interface SupervisorOptions {
  channel?: "beta" | "dev" | "stable";
  diagnostics?: boolean;
  addons_repositories?: string[];
}

export const reloadSupervisor = async (opp: OpenPeerPower) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: "/supervisor/reload",
      method: "post",
    });
    return;
  }

  await opp.callApi<OppioResponse<void>>("POST", `oppio/supervisor/reload`);
};

export const restartSupervisor = async (opp: OpenPeerPower) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: "/supervisor/restart",
      method: "post",
      timeout: null,
    });
    return;
  }

  await opp.callApi<OppioResponse<void>>("POST", `oppio/supervisor/restart`);
};

export const updateSupervisor = async (opp: OpenPeerPower) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: "/supervisor/update",
      method: "post",
      timeout: null,
    });
    return;
  }

  await opp.callApi<OppioResponse<void>>("POST", `oppio/supervisor/update`);
};

export const fetchOppioOpenPeerPowerInfo = async (
  opp: OpenPeerPower
): Promise<OppioOpenPeerPowerInfo> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: "/core/info",
      method: "get",
    });
  }

  return oppioApiResultExtractor(
    await opp.callApi<OppioResponse<OppioOpenPeerPowerInfo>>(
      "GET",
      "oppio/core/info"
    )
  );
};

export const fetchOppioSupervisorInfo = async (
  opp: OpenPeerPower
): Promise<OppioSupervisorInfo> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: "/supervisor/info",
      method: "get",
    });
  }

  return oppioApiResultExtractor(
    await opp.callApi<OppioResponse<OppioSupervisorInfo>>(
      "GET",
      "oppio/supervisor/info"
    )
  );
};

export const fetchOppioInfo = async (
  opp: OpenPeerPower
): Promise<OppioInfo> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: "/info",
      method: "get",
    });
  }

  return oppioApiResultExtractor(
    await opp.callApi<OppioResponse<OppioInfo>>("GET", "oppio/info")
  );
};

export const fetchOppioLogs = async (opp: OpenPeerPower, provider: string) => {
  return opp.callApi<string>("GET", `oppio/${provider}/logs`);
};

export const setSupervisorOption = async (
  opp: OpenPeerPower,
  data: SupervisorOptions
) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: "/supervisor/options",
      method: "post",
      data,
    });
    return;
  }

  await opp.callApi<OppioResponse<void>>(
    "POST",
    "oppio/supervisor/options",
    data
  );
};
