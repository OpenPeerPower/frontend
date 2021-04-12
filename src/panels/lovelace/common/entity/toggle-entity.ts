import { STATES_OFF } from "../../../../common/const";
import { OpenPeerPower, ServiceCallResponse } from "../../../../types";
import { turnOnOffEntity } from "./turn-on-off-entity";

export const toggleEntity = (
  opp: OpenPeerPower,
  entityId: string
): Promise<ServiceCallResponse> => {
  const turnOn = STATES_OFF.includes(opp.states[entityId].state);
  return turnOnOffEntity(opp, entityId, turnOn);
};
