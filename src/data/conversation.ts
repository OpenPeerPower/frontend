import { OpenPeerPower } from "../types";

interface ProcessResults {
  card: { [key: string]: Record<string, string> };
  speech: {
    [SpeechType in "plain" | "ssml"]: { extra_data: any; speech: string };
  };
}

export interface AgentInfo {
  attribution?: { name: string; url: string };
  onboarding?: { text: string; url: string };
}

export const processText = (
  opp: OpenPeerPower,
  text: string,
  // eslint-disable-next-line: variable-name
  conversation_id: string
): Promise<ProcessResults> =>
  opp.callWS({
    type: "conversation/process",
    text,
    conversation_id,
  });

export const getAgentInfo = (opp: OpenPeerPower): Promise<AgentInfo> =>
  opp.callWS({
    type: "conversation/agent/info",
  });

export const setConversationOnboarding = (
  opp: OpenPeerPower,
  value: boolean
): Promise<boolean> =>
  opp.callWS({
    type: "conversation/onboarding/set",
    shown: value,
  });
