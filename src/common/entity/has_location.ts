import { OppEntity } from "open-peer-power-js-websocket";

export const hasLocation = (stateObj: OppEntity) => {
  return (
    "latitude" in stateObj.attributes && "longitude" in stateObj.attributes
  );
};
