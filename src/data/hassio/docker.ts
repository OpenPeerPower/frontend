import { atLeastVersion } from "../../common/config/version";
import { OpenPeerPower } from "../../types";
import { oppioApiResultExtractor, OppioResponse } from "./common";

interface OppioDockerRegistries {
  [key: string]: { username: string; password?: string };
}

export const fetchOppioDockerRegistries = async (
  opp: OpenPeerPower
): Promise<OppioDockerRegistries> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: `/docker/registries`,
      method: "get",
    });
  }

  return oppioApiResultExtractor(
    await opp.callApi<OppioResponse<OppioDockerRegistries>>(
      "GET",
      "oppio/docker/registries"
    )
  );
};

export const addOppioDockerRegistry = async (
  opp: OpenPeerPower,
  data: OppioDockerRegistries
) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: `/docker/registries`,
      method: "post",
      data,
    });
    return;
  }

  await opp.callApi<OppioResponse<OppioDockerRegistries>>(
    "POST",
    "oppio/docker/registries",
    data
  );
};

export const removeOppioDockerRegistry = async (
  opp: OpenPeerPower,
  registry: string
) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: `/docker/registries/${registry}`,
      method: "delete",
    });
    return;
  }

  await opp.callApi<OppioResponse<void>>(
    "DELETE",
    `oppio/docker/registries/${registry}`
  );
};
