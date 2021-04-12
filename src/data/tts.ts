import { OpenPeerPower } from "../types";

export const convertTextToSpeech = (
  opp: OpenPeerPower,
  data: {
    platform: string;
    message: string;
    cache?: boolean;
    language?: string;
    options?: Record<string, unknown>;
  }
) => opp.callApi<{ url: string; path: string }>("POST", "tts_get_url", data);
