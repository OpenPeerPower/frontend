import { OppEntity } from "openpeerpower-js-websocket";

export const hasLocation = (stateObj: OppEntity) =>
  "latitude" in stateObj.attributes && "longitude" in stateObj.attributes;
