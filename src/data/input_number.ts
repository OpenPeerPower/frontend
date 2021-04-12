import { OpenPeerPower } from "../types";

export interface InputNumber {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  mode: "box" | "slider";
  icon?: string;
  initial?: number;
  unit_of_measurement?: string;
}

export interface InputNumberMutableParams {
  name: string;
  icon: string;
  initial: number;
  min: number;
  max: number;
  step: number;
  mode: "box" | "slider";
  unit_of_measurement?: string;
}

export const fetchInputNumber = (opp: OpenPeerPower) =>
  opp.callWS<InputNumber[]>({ type: "input_number/list" });

export const createInputNumber = (
  opp: OpenPeerPower,
  values: InputNumberMutableParams
) =>
  opp.callWS<InputNumber>({
    type: "input_number/create",
    ...values,
  });

export const updateInputNumber = (
  opp: OpenPeerPower,
  id: string,
  updates: Partial<InputNumberMutableParams>
) =>
  opp.callWS<InputNumber>({
    type: "input_number/update",
    input_number_id: id,
    ...updates,
  });

export const deleteInputNumber = (opp: OpenPeerPower, id: string) =>
  opp.callWS({
    type: "input_number/delete",
    input_number_id: id,
  });
