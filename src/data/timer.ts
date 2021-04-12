import {
  OppEntityAttributeBase,
  OppEntityBase,
} from "open-peer-power-js-websocket";
import { OpenPeerPower } from "../types";

export type TimerEntity = OppEntityBase & {
  attributes: OppEntityAttributeBase & {
    duration: string;
    remaining: string;
  };
};

export interface DurationDict {
  hours?: number | string;
  minutes?: number | string;
  seconds?: number | string;
}

export interface Timer {
  id: string;
  name: string;
  icon?: string;
  duration?: string | number | DurationDict;
}

export interface TimerMutableParams {
  name: string;
  icon: string;
  duration: string | number | DurationDict;
}

export const fetchTimer = (opp: OpenPeerPower) =>
  opp.callWS<Timer[]>({ type: "timer/list" });

export const createTimer = (opp: OpenPeerPower, values: TimerMutableParams) =>
  opp.callWS<Timer>({
    type: "timer/create",
    ...values,
  });

export const updateTimer = (
  opp: OpenPeerPower,
  id: string,
  updates: Partial<TimerMutableParams>
) =>
  opp.callWS<Timer>({
    type: "timer/update",
    timer_id: id,
    ...updates,
  });

export const deleteTimer = (opp: OpenPeerPower, id: string) =>
  opp.callWS({
    type: "timer/delete",
    timer_id: id,
  });
