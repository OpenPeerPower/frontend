import { atLeastVersion } from "../../common/config/version";
import { OpenPeerPower } from "../../types";
import { oppioApiResultExtractor, OppioResponse } from "./common";

export interface OppioHardwareAudioDevice {
  device?: string | null;
  name: string;
}

interface OppioHardwareAudioList {
  audio: {
    input: Record<string, string>;
    output: Record<string, string>;
  };
}

export interface OppioHardwareInfo {
  serial: string[];
  input: string[];
  disk: string[];
  gpio: string[];
  audio: Record<string, unknown>;
}

export const fetchOppioHardwareAudio = async (
  opp: OpenPeerPower
): Promise<OppioHardwareAudioList> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: `/hardware/audio`,
      method: "get",
    });
  }

  return oppioApiResultExtractor(
    await opp.callApi<OppioResponse<OppioHardwareAudioList>>(
      "GET",
      "oppio/hardware/audio"
    )
  );
};

export const fetchOppioHardwareInfo = async (
  opp: OpenPeerPower
): Promise<OppioHardwareInfo> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    return await opp.callWS({
      type: "supervisor/api",
      endpoint: `/hardware/info`,
      method: "get",
    });
  }

  return oppioApiResultExtractor(
    await opp.callApi<OppioResponse<OppioHardwareInfo>>(
      "GET",
      "oppio/hardware/info"
    )
  );
};
