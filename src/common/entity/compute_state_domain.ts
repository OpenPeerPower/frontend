import { OppEntity } from "open-peer-power-js-websocket";
import { computeDomain } from "./compute_domain";

export const computeStateDomain = (stateObj: OppEntity) => {
  return computeDomain(stateObj.entity_id);
};
