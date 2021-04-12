import { OpenPeerPower } from "../../types";

/** Get the location name from a opp object. */
export default function computeLocationName(opp: OpenPeerPower): string {
  return opp && opp.config.location_name;
}
