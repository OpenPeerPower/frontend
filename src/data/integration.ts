import { LocalizeFunc } from "../common/translations/localize";
import { OpenPeerPower } from "../types";

export interface IntegrationManifest {
  is_built_in: boolean;
  domain: string;
  name: string;
  config_flow: boolean;
  documentation: string;
  issue_tracker?: string;
  dependencies?: string[];
  after_dependencies?: string[];
  codeowners?: string[];
  requirements?: string[];
  ssdp?: Array<{ manufacturer?: string; modelName?: string; st?: string }>;
  zeroconf?: string[];
  homekit?: { models: string[] };
  quality_scale?: "gold" | "internal" | "platinum" | "silver";
  iot_class:
    | "assumed_state"
    | "cloud_polling"
    | "cloud_push"
    | "local_polling"
    | "local_push";
}

export interface IntegrationSetup {
  domain: string;
  seconds?: number;
}

export const integrationIssuesUrl = (
  domain: string,
  manifest: IntegrationManifest
) =>
  manifest.issue_tracker ||
  `https://github.com/open-peer-power/open-peer-power/issues?q=is%3Aissue+is%3Aopen+label%3A%22integration%3A+${domain}%22`;

export const domainToName = (
  localize: LocalizeFunc,
  domain: string,
  manifest?: IntegrationManifest
) => localize(`component.${domain}.title`) || manifest?.name || domain;

export const fetchIntegrationManifests = (opp: OpenPeerPower) =>
  opp.callWS<IntegrationManifest[]>({ type: "manifest/list" });

export const fetchIntegrationManifest = (
  opp: OpenPeerPower,
  integration: string
) => opp.callWS<IntegrationManifest>({ type: "manifest/get", integration });

export const fetchIntegrationSetups = (opp: OpenPeerPower) =>
  opp.callWS<IntegrationSetup[]>({ type: "integration/setup_info" });
