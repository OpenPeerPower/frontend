import { OpenPeerPower } from "../types";

export interface InputDateTime {
  id: string;
  name: string;
  icon?: string;
  initial?: string;
  has_time: boolean;
  has_date: boolean;
}

export interface InputDateTimeMutableParams {
  name: string;
  icon: string;
  initial: string;
  has_time: boolean;
  has_date: boolean;
}

export const setInputDateTimeValue = (
  opp: OpenPeerPower,
  entityId: string,
  time: string | undefined = undefined,
  date: string | undefined = undefined
) => {
  const param = { entity_id: entityId, time, date };
  opp.callService(entityId.split(".", 1)[0], "set_datetime", param);
};

export const fetchInputDateTime = (opp: OpenPeerPower) =>
  opp.callWS<InputDateTime[]>({ type: "input_datetime/list" });

export const createInputDateTime = (
  opp: OpenPeerPower,
  values: InputDateTimeMutableParams
) =>
  opp.callWS<InputDateTime>({
    type: "input_datetime/create",
    ...values,
  });

export const updateInputDateTime = (
  opp: OpenPeerPower,
  id: string,
  updates: Partial<InputDateTimeMutableParams>
) =>
  opp.callWS<InputDateTime>({
    type: "input_datetime/update",
    input_datetime_id: id,
    ...updates,
  });

export const deleteInputDateTime = (opp: OpenPeerPower, id: string) =>
  opp.callWS({
    type: "input_datetime/delete",
    input_datetime_id: id,
  });
