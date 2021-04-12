import { OpenPeerPower } from "../types";
import { Action } from "./script";

export const callExecuteScript = (opp: OpenPeerPower, sequence: Action[]) =>
  opp.callWS({
    type: "execute_script",
    sequence,
  });
