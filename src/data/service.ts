import { OpenPeerPower } from "../types";
import { Action } from "./script";

export const callExecuteScript = (opp: OpenPeerPower, sequence: Action[]) =>
  opp.callWS({
    type: "execute_script",
    sequence,
  });

export const serviceCallWillDisconnect = (domain: string, service: string) =>
  domain === "openpeerpower" && ["restart", "stop"].includes(service);
