import { UNAVAILABLE } from "../../../data/entity";
import { OpenPeerPower } from "../../../types";

export interface Condition {
  entity: string;
  state?: string;
  state_not?: string;
}

export function checkConditionsMet(
  conditions: Condition[],
  opp: OpenPeerPower
): boolean {
  return conditions.every((c) => {
    const state = opp.states[c.entity]
      ? opp!.states[c.entity].state
      : UNAVAILABLE;

    return c.state ? state === c.state : state !== c.state_not;
  });
}

export function validateConditionalConfig(conditions: Condition[]): boolean {
  return conditions.every(
    (c) => ((c.entity && (c.state || c.state_not)) as unknown) as boolean
  );
}
