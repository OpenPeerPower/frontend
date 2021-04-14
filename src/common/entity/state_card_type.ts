import { OppEntity } from "openpeerpower-js-websocket";
import { UNAVAILABLE } from "../../data/entity";
import { OpenPeerPower } from "../../types";
import { DOMAINS_WITH_CARD } from "../const";
import { canToggleState } from "./can_toggle_state";
import { computeStateDomain } from "./compute_state_domain";

export const stateCardType = (opp: OpenPeerPower, stateObj: OppEntity) => {
  if (stateObj.state === UNAVAILABLE) {
    return "display";
  }

  const domain = computeStateDomain(stateObj);

  if (DOMAINS_WITH_CARD.includes(domain)) {
    return domain;
  }
  if (
    canToggleState(opp, stateObj) &&
    stateObj.attributes.control !== "hidden"
  ) {
    return "toggle";
  }
  return "display";
};
