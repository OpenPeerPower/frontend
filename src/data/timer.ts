import {
  OppEntity,
  OppEntityAttributeBase,
  OppEntityBase,
} from "openpeerpower-js-websocket";
import durationToSeconds from "../common/datetime/duration_to_seconds";
import secondsToDuration from "../common/datetime/seconds_to_duration";
import { computeStateDisplay } from "../common/entity/compute_state_display";
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

export const timerTimeRemaining = (
  stateObj: OppEntity
): undefined | number => {
  if (!stateObj.attributes.remaining) {
    return undefined;
  }
  let timeRemaining = durationToSeconds(stateObj.attributes.remaining);

  if (stateObj.state === "active") {
    const now = new Date().getTime();
    const madeActive = new Date(stateObj.last_changed).getTime();
    timeRemaining = Math.max(timeRemaining - (now - madeActive) / 1000, 0);
  }

  return timeRemaining;
};

export const computeDisplayTimer = (
  opp: OpenPeerPower,
  stateObj: OppEntity,
  timeRemaining?: number
): string | null => {
  if (!stateObj) {
    return null;
  }

  if (stateObj.state === "idle" || timeRemaining === 0) {
    return computeStateDisplay(opp.localize, stateObj, opp.locale);
  }

  let display = secondsToDuration(timeRemaining || 0);

  if (stateObj.state === "paused") {
    display = `${display} (${computeStateDisplay(
      opp.localize,
      stateObj,
      opp.locale
    )})`;
  }

  return display;
};
