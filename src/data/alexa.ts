import { OpenPeerPower } from "../types";

export interface AlexaEntity {
  entity_id: string;
  display_categories: string[];
  interfaces: string[];
}

export const fetchCloudAlexaEntities = (opp: OpenPeerPower) =>
  opp.callWS<AlexaEntity[]>({ type: "cloud/alexa/entities" });

export const syncCloudAlexaEntities = (opp: OpenPeerPower) =>
  opp.callWS({ type: "cloud/alexa/sync" });
