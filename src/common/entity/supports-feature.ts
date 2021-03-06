import { OppEntity } from "openpeerpower-js-websocket";

export const supportsFeature = (
  stateObj: OppEntity,
  feature: number
): boolean => {
  // eslint-disable-next-line no-bitwise
  return (stateObj.attributes.supported_features! & feature) !== 0;
};
