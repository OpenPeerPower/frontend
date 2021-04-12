import { OpenPeerPower } from "../types";

export const documentationUrl = (opp: OpenPeerPower, path: string) => {
  return `https://${
    opp.config.version.includes("b")
      ? "rc"
      : opp.config.version.includes("dev")
      ? "next"
      : "www"
  }.openpeerpower.io${path}`;
};
