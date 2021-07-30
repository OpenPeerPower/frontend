import { atLeastVersion } from "../../common/config/version";
import { HaFormSchema } from "../../components/ha-form/ha-form";
import { OpenPeerPower } from "../../types";
import { SupervisorArch } from "../supervisor/supervisor";
import {
  extractApiErrorMessage,
  oppioApiResultExtractor,
  OppioResponse,
} from "./common";

export type AddonStage = "stable" | "experimental" | "deprecated";
export type AddonAppArmour = "disable" | "default" | "profile";
export type AddonRole = "default" | "openpeerpower" | "manager" | "admin";
export type AddonStartup =
  | "initialize"
  | "system"
  | "services"
  | "application"
  | "once";
export type AddonState = "started" | "stopped" | null;
export type AddonRepository = "core" | "local" | string;

interface AddonTranslations {
  [key: string]: Record<string, Record<string, Record<string, string>>>;
}

export interface OppioAddonInfo {
  advanced: boolean;
  available: boolean;
  build: boolean;
  description: string;
  detached: boolean;
  openpeerpower: string;
  icon: boolean;
  installed: boolean;
  logo: boolean;
  name: string;
  repository: AddonRepository;
  slug: string;
  stage: AddonStage;
  state: AddonState;
  update_available: boolean;
  url: string | null;
  version_latest: string;
  version: string;
}

export interface OppioAddonDetails extends OppioAddonInfo {
  apparmor: AddonAppArmour;
  arch: SupervisorArch[];
  audio_input: null | string;
  audio_output: null | string;
  audio: boolean;
  auth_api: boolean;
  auto_uart: boolean;
  auto_update: boolean;
  boot: "auto" | "manual";
  changelog: boolean;
  devices: string[];
  devicetree: boolean;
  discovery: string[];
  docker_api: boolean;
  documentation: boolean;
  full_access: boolean;
  gpio: boolean;
  oppio_api: boolean;
  oppio_role: AddonRole;
  hostname: string;
  openpeerpower_api: boolean;
  host_dbus: boolean;
  host_ipc: boolean;
  host_network: boolean;
  host_pid: boolean;
  ingress_entry: null | string;
  ingress_panel: boolean;
  ingress_url: null | string;
  ingress: boolean;
  ip_address: string;
  kernel_modules: boolean;
  long_description: null | string;
  machine: any;
  network_description: null | Record<string, string>;
  network: null | Record<string, number>;
  options: Record<string, unknown>;
  privileged: any;
  protected: boolean;
  rating: "1-6";
  schema: HaFormSchema[] | null;
  services_role: string[];
  slug: string;
  startup: AddonStartup;
  stdin: boolean;
  translations: AddonTranslations;
  watchdog: null | boolean;
  webui: null | string;
}

export interface OppioAddonsInfo {
  addons: OppioAddonInfo[];
  repositories: OppioAddonRepository[];
}

export interface OppioAddonSetSecurityParams {
  protected?: boolean;
}

export interface OppioAddonRepository {
  slug: string;
  name: string;
  source: string;
  url: string;
  maintainer: string;
}

export interface OppioAddonSetOptionParams {
  audio_input?: string | null;
  audio_output?: string | null;
  options?: Record<string, unknown> | null;
  boot?: "auto" | "manual";
  auto_update?: boolean;
  ingress_panel?: boolean;
  network?: Record<string, unknown> | null;
  watchdog?: boolean;
}

export const reloadOppioAddons = async (opp: OpenPeerPower) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: "/addons/reload",
      method: "post",
    });
    return;
  }
  await opp.callApi<OppioResponse<void>>("POST", `oppio/addons/reload`);
};

export const fetchOppioAddonsInfo = async (
  opp: OpenPeerPower
): Promise<OppioAddonsInfo> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return opp.callWS({
      type: "supervisor/api",
      endpoint: "/addons",
      method: "get",
    });
  }

  return oppioApiResultExtractor(
    await opp.callApi<OppioResponse<OppioAddonsInfo>>("GET", `oppio/addons`)
  );
};

export const fetchOppioAddonInfo = async (
  opp: OpenPeerPower,
  slug: string
): Promise<OppioAddonDetails> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return opp.callWS({
      type: "supervisor/api",
      endpoint: `/addons/${slug}/info`,
      method: "get",
    });
  }

  return oppioApiResultExtractor(
    await opp.callApi<OppioResponse<OppioAddonDetails>>(
      "GET",
      `oppio/addons/${slug}/info`
    )
  );
};

export const fetchOppioAddonChangelog = async (
  opp: OpenPeerPower,
  slug: string
) => opp.callApi<string>("GET", `oppio/addons/${slug}/changelog`);

export const fetchOppioAddonLogs = async (opp: OpenPeerPower, slug: string) =>
  opp.callApi<string>("GET", `oppio/addons/${slug}/logs`);

export const fetchOppioAddonDocumentation = async (
  opp: OpenPeerPower,
  slug: string
) => opp.callApi<string>("GET", `oppio/addons/${slug}/documentation`);

export const setOppioAddonOption = async (
  opp: OpenPeerPower,
  slug: string,
  data: OppioAddonSetOptionParams
) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    const response = await opp.callWS<OppioResponse<any>>({
      type: "supervisor/api",
      endpoint: `/addons/${slug}/options`,
      method: "post",
      data,
    });

    if (response.result === "error") {
      throw Error(extractApiErrorMessage(response));
    }
    return response;
  }

  return opp.callApi<OppioResponse<any>>(
    "POST",
    `oppio/addons/${slug}/options`,
    data
  );
};

export const validateOppioAddonOption = async (
  opp: OpenPeerPower,
  slug: string,
  data?: any
): Promise<{ message: string; valid: boolean }> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return opp.callWS({
      type: "supervisor/api",
      endpoint: `/addons/${slug}/options/validate`,
      method: "post",
      data,
    });
  }

  return (
    await opp.callApi<OppioResponse<{ message: string; valid: boolean }>>(
      "POST",
      `oppio/addons/${slug}/options/validate`
    )
  ).data;
};

export const startOppioAddon = async (opp: OpenPeerPower, slug: string) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return opp.callWS({
      type: "supervisor/api",
      endpoint: `/addons/${slug}/start`,
      method: "post",
      timeout: null,
    });
  }

  return opp.callApi<string>("POST", `oppio/addons/${slug}/start`);
};

export const stopOppioAddon = async (opp: OpenPeerPower, slug: string) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return opp.callWS({
      type: "supervisor/api",
      endpoint: `/addons/${slug}/stop`,
      method: "post",
      timeout: null,
    });
  }

  return opp.callApi<string>("POST", `oppio/addons/${slug}/stop`);
};

export const setOppioAddonSecurity = async (
  opp: OpenPeerPower,
  slug: string,
  data: OppioAddonSetSecurityParams
) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: `/addons/${slug}/security`,
      method: "post",
      data,
    });
    return;
  }

  await opp.callApi<OppioResponse<void>>(
    "POST",
    `oppio/addons/${slug}/security`,
    data
  );
};

export const installOppioAddon = async (
  opp: OpenPeerPower,
  slug: string
): Promise<void> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: `/addons/${slug}/install`,
      method: "post",
      timeout: null,
    });
    return;
  }

  await opp.callApi<OppioResponse<void>>(
    "POST",
    `oppio/addons/${slug}/install`
  );
};

export const updateOppioAddon = async (
  opp: OpenPeerPower,
  slug: string
): Promise<void> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: `/store/addons/${slug}/update`,
      method: "post",
      timeout: null,
    });
  } else {
    await opp.callApi<OppioResponse<void>>(
      "POST",
      `oppio/addons/${slug}/update`
    );
  }
};

export const restartOppioAddon = async (
  opp: OpenPeerPower,
  slug: string
): Promise<void> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: `/addons/${slug}/restart`,
      method: "post",
      timeout: null,
    });
    return;
  }

  await opp.callApi<OppioResponse<void>>(
    "POST",
    `oppio/addons/${slug}/restart`
  );
};

export const uninstallOppioAddon = async (
  opp: OpenPeerPower,
  slug: string
) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: `/addons/${slug}/uninstall`,
      method: "post",
      timeout: null,
    });
    return;
  }

  await opp.callApi<OppioResponse<void>>(
    "POST",
    `oppio/addons/${slug}/uninstall`
  );
};
