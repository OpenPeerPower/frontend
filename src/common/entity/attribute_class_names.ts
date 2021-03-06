import { OppEntity } from "openpeerpower-js-websocket";

export const attributeClassNames = (
  stateObj: OppEntity,
  attributes: string[]
): string => {
  if (!stateObj) {
    return "";
  }
  return attributes
    .map((attribute) =>
      attribute in stateObj.attributes ? "has-" + attribute : ""
    )
    .filter((attr) => attr !== "")
    .join(" ");
};
