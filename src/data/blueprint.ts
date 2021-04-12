import { OpenPeerPower } from "../types";
import { Selector } from "./selector";

export type Blueprints = Record<string, BlueprintOrError>;

export type BlueprintOrError = Blueprint | { error: string };
export interface Blueprint {
  metadata: BlueprintMetaData;
}

export interface BlueprintMetaData {
  domain: string;
  name: string;
  input?: Record<string, BlueprintInput | null>;
  description?: string;
  source_url?: string;
}

export interface BlueprintInput {
  name?: string;
  description?: string;
  selector?: Selector;
  default?: any;
}

export interface BlueprintImportResult {
  suggested_filename: string;
  raw_data: string;
  blueprint: Blueprint;
  validation_errors: string[] | null;
}

export const fetchBlueprints = (opp: OpenPeerPower, domain: string) =>
  opp.callWS<Blueprints>({ type: "blueprint/list", domain });

export const importBlueprint = (opp: OpenPeerPower, url: string) =>
  opp.callWS<BlueprintImportResult>({ type: "blueprint/import", url });

export const saveBlueprint = (
  opp: OpenPeerPower,
  domain: string,
  path: string,
  yaml: string,
  source_url?: string
) =>
  opp.callWS({
    type: "blueprint/save",
    domain,
    path,
    yaml,
    source_url,
  });

export const deleteBlueprint = (
  opp: OpenPeerPower,
  domain: string,
  path: string
) =>
  opp.callWS<BlueprintImportResult>({
    type: "blueprint/delete",
    domain,
    path,
  });
