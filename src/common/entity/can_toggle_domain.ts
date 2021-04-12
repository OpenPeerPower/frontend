import { OpenPeerPower } from "../../types";

export const canToggleDomain = (opp: OpenPeerPower, domain: string) => {
  const services = opp.services[domain];
  if (!services) {
    return false;
  }

  if (domain === "lock") {
    return "lock" in services;
  }
  if (domain === "cover") {
    return "open_cover" in services;
  }
  return "turn_on" in services;
};
