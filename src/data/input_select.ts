import {
  OppEntityAttributeBase,
  OppEntityBase,
} from "openpeerpower-js-websocket";
import { OpenPeerPower } from "../types";

interface InputSelectEntityAttributes extends OppEntityAttributeBase {
  options: string[];
}

export interface InputSelectEntity extends OppEntityBase {
  attributes: InputSelectEntityAttributes;
}

export interface InputSelect {
  id: string;
  name: string;
  options: string[];
  icon?: string;
  initial?: string;
}

export interface InputSelectMutableParams {
  name: string;
  icon: string;
  initial: string;
  options: string[];
}

export const setInputSelectOption = (
  opp: OpenPeerPower,
  entity: string,
  option: string
) =>
  opp.callService("input_select", "select_option", {
    option,
    entity_id: entity,
  });

export const fetchInputSelect = (opp: OpenPeerPower) =>
  opp.callWS<InputSelect[]>({ type: "input_select/list" });

export const createInputSelect = (
  opp: OpenPeerPower,
  values: InputSelectMutableParams
) =>
  opp.callWS<InputSelect>({
    type: "input_select/create",
    ...values,
  });

export const updateInputSelect = (
  opp: OpenPeerPower,
  id: string,
  updates: Partial<InputSelectMutableParams>
) =>
  opp.callWS<InputSelect>({
    type: "input_select/update",
    input_select_id: id,
    ...updates,
  });

export const deleteInputSelect = (opp: OpenPeerPower, id: string) =>
  opp.callWS({
    type: "input_select/delete",
    input_select_id: id,
  });
