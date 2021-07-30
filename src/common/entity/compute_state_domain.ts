import { OppEntity } from "openpeerpower-js-websocket";
import { computeDomain } from "./compute_domain";

export const computeStateDomain = (stateObj: OppEntity) =>
  computeDomain(stateObj.entity_id);
