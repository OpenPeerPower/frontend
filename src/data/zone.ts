import { navigate } from "../common/navigate";
import { OpenPeerPower } from "../types";

export const defaultRadiusColor = "#FF9800";
export const homeRadiusColor = "#03a9f4";
export const passiveRadiusColor = "#9b9b9b";

export interface Zone {
  id: string;
  name: string;
  icon?: string;
  latitude: number;
  longitude: number;
  passive?: boolean;
  radius?: number;
}

export interface ZoneMutableParams {
  icon: string;
  latitude: number;
  longitude: number;
  name: string;
  passive: boolean;
  radius: number;
}

export const fetchZones = (opp: OpenPeerPower) =>
  opp.callWS<Zone[]>({ type: "zone/list" });

export const createZone = (opp: OpenPeerPower, values: ZoneMutableParams) =>
  opp.callWS<Zone>({
    type: "zone/create",
    ...values,
  });

export const updateZone = (
  opp: OpenPeerPower,
  zoneId: string,
  updates: Partial<ZoneMutableParams>
) =>
  opp.callWS<Zone>({
    type: "zone/update",
    zone_id: zoneId,
    ...updates,
  });

export const deleteZone = (opp: OpenPeerPower, zoneId: string) =>
  opp.callWS({
    type: "zone/delete",
    zone_id: zoneId,
  });

let inititialZoneEditorData: Partial<ZoneMutableParams> | undefined;

export const showZoneEditor = (
  el: HTMLElement,
  data?: Partial<ZoneMutableParams>
) => {
  inititialZoneEditorData = data;
  navigate(el, "/config/zone/new");
};

export const getZoneEditorInitData = () => {
  const data = inititialZoneEditorData;
  inititialZoneEditorData = undefined;
  return data;
};
