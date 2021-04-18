import { atLeastVersion } from "../../common/config/version";
import { OpenPeerPower } from "../../types";
import { oppioApiResultExtractor, OppioResponse } from "./common";

export interface OppioResolution {
  unsupported: string[];
  unhealthy: string[];
  issues: string[];
  suggestions: string[];
}

export const fetchOppioResolution = async (
  opp: OpenPeerPower
): Promise<OppioResolution> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: "/resolution/info",
      method: "get",
    });
  }

  return oppioApiResultExtractor(
    await opp.callApi<OppioResponse<OppioResolution>>(
      "GET",
      "oppio/resolution/info"
    )
  );
};
