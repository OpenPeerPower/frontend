import { BaseCastMessage } from "./types";

// Messages to be processed inside the Open Peer Power UI

export interface ReceiverStatusMessage extends BaseCastMessage {
  type: "receiver_status";
  connected: boolean;
  showDemo: boolean;
  oppUrl?: string;
  lovelacePath?: string | number | null;
  urlPath?: string | null;
}

export type SenderMessage = ReceiverStatusMessage;
