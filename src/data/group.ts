import {
  OppEntityAttributeBase,
  OppEntityBase,
} from "openpeerpower-js-websocket";

interface GroupEntityAttributes extends OppEntityAttributeBase {
  entity_id: string[];
  order: number;
  auto?: boolean;
  view?: boolean;
  control?: "hidden";
}
export interface GroupEntity extends OppEntityBase {
  attributes: GroupEntityAttributes;
}
