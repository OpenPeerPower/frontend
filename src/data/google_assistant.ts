import { OpenPeerPower } from "../types";

export interface GoogleEntity {
  entity_id: string;
  traits: string[];
  might_2fa: boolean;
}

export const fetchCloudGoogleEntities = (opp: OpenPeerPower) =>
  opp.callWS<GoogleEntity[]>({ type: "cloud/google_assistant/entities" });
