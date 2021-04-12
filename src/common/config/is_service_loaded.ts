import { OpenPeerPower } from "../../types";

/** Return if a service is loaded. */
export const isServiceLoaded = (
  opp: OpenPeerPower,
  domain: string,
  service: string
): boolean =>
  opp && domain in opp.services && service in opp.services[domain];
