import { OpenPeerPower } from "../types";

export interface InputBoolean {
  id: string;
  name: string;
  icon?: string;
  initial?: boolean;
}

export interface InputBooleanMutableParams {
  name: string;
  icon: string;
  initial: boolean;
}

export const fetchInputBoolean = (opp: OpenPeerPower) =>
  opp.callWS<InputBoolean[]>({ type: "input_boolean/list" });

export const createInputBoolean = (
  opp: OpenPeerPower,
  values: InputBooleanMutableParams
) =>
  opp.callWS<InputBoolean>({
    type: "input_boolean/create",
    ...values,
  });

export const updateInputBoolean = (
  opp: OpenPeerPower,
  id: string,
  updates: Partial<InputBooleanMutableParams>
) =>
  opp.callWS<InputBoolean>({
    type: "input_boolean/update",
    input_boolean_id: id,
    ...updates,
  });

export const deleteInputBoolean = (opp: OpenPeerPower, id: string) =>
  opp.callWS({
    type: "input_boolean/delete",
    input_boolean_id: id,
  });
