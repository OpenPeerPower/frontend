import { OpenPeerPower } from "../types";

export const fetchErrorLog = (opp: OpenPeerPower) =>
  opp.callApi<string>("GET", "error_log");
