import { OpenPeerPower } from "../../types";

/** Return an array of domains with the service. */
export const componentsWithService = (
  opp: OpenPeerPower,
  service: string
): Array<string> =>
  opp &&
  Object.keys(opp.services).filter((key) => service in opp.services[key]);
