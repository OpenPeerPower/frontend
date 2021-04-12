import { OpenPeerPower } from "../types";

export interface RelatedResult {
  area?: string[];
  automation?: string[];
  config_entry?: string[];
  device?: string[];
  entity?: string[];
  group?: string[];
  scene?: string[];
  script?: string[];
}

export type ItemType =
  | "area"
  | "automation"
  | "config_entry"
  | "device"
  | "entity"
  | "group"
  | "scene"
  | "script";

export const findRelated = (
  opp: OpenPeerPower,
  itemType: ItemType,
  itemId: string
): Promise<RelatedResult> =>
  opp.callWS({
    type: "search/related",
    item_type: itemType,
    item_id: itemId,
  });
