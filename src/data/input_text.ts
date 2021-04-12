import { OpenPeerPower } from "../types";

export interface InputText {
  id: string;
  name: string;
  icon?: string;
  initial?: string;
  min?: number;
  max?: number;
  pattern?: string;
  mode?: "text" | "password";
}

export interface InputTextMutableParams {
  name: string;
  icon: string;
  initial: string;
  min: number;
  max: number;
  pattern: string;
  mode: "text" | "password";
}

export const setValue = (opp: OpenPeerPower, entity: string, value: string) =>
  opp.callService(entity.split(".", 1)[0], "set_value", {
    value,
    entity_id: entity,
  });

export const fetchInputText = (opp: OpenPeerPower) =>
  opp.callWS<InputText[]>({ type: "input_text/list" });

export const createInputText = (
  opp: OpenPeerPower,
  values: InputTextMutableParams
) =>
  opp.callWS<InputText>({
    type: "input_text/create",
    ...values,
  });

export const updateInputText = (
  opp: OpenPeerPower,
  id: string,
  updates: Partial<InputTextMutableParams>
) =>
  opp.callWS<InputText>({
    type: "input_text/update",
    input_text_id: id,
    ...updates,
  });

export const deleteInputText = (opp: OpenPeerPower, id: string) =>
  opp.callWS({
    type: "input_text/delete",
    input_text_id: id,
  });
