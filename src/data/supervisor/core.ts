import { atLeastVersion } from "../../common/config/version";
import { OpenPeerPower } from "../../types";
import { OppioResponse } from "../oppio/common";

export const restartCore = async (opp: OpenPeerPower) => {
  await opp.callService("openpeerpower", "restart");
};

export const updateCore = async (opp: OpenPeerPower) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: "/core/update",
      method: "post",
      timeout: null,
    });
  } else {
    await opp.callApi<OppioResponse<void>>("POST", `oppio/core/update`);
  }
};
