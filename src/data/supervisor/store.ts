import { atLeastVersion } from "../../common/config/version";
import { OpenPeerPower } from "../../types";
import { AddonRepository, AddonStage } from "../oppio/addon";
import { oppioApiResultExtractor, OppioResponse } from "../oppio/common";

export interface StoreAddon {
  advanced: boolean;
  available: boolean;
  build: boolean;
  description: string;
  openpeerpower: string | null;
  icon: boolean;
  installed: boolean;
  logo: boolean;
  name: string;
  repository: AddonRepository;
  slug: string;
  stage: AddonStage;
  update_available: boolean;
  url: string;
  version: string | null;
  version_latest: string;
}
interface StoreRepository {
  maintainer: string;
  name: string;
  slug: string;
  source: string;
  url: string;
}

export interface SupervisorStore {
  addons: StoreAddon[];
  repositories: StoreRepository[];
}

export const fetchSupervisorStore = async (
  opp: OpenPeerPower
): Promise<SupervisorStore> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: "/store",
      method: "get",
    });
  }

  return oppioApiResultExtractor(
    await opp.callApi<OppioResponse<SupervisorStore>>("GET", `oppio/store`)
  );
};
