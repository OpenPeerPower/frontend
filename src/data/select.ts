import {
  OppEntityAttributeBase,
  OppEntityBase,
} from "openpeerpower-js-websocket";
import { OpenPeerPower } from "../types";

interface SelectEntityAttributes extends OppEntityAttributeBase {
  options: string[];
}

export interface SelectEntity extends OppEntityBase {
  attributes: SelectEntityAttributes;
}

export const setSelectOption = (
  opp: OpenPeerPower,
  entity: string,
  option: string
) =>
  opp.callService(
    "select",
    "select_option",
    { option },
    { entity_id: entity }
  );
