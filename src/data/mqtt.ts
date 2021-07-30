import { OpenPeerPower } from "../types";

export interface MQTTMessage {
  topic: string;
  payload: string;
  qos: number;
  retain: number;
  time: string;
}

export interface MQTTTopicDebugInfo {
  topic: string;
  messages: MQTTMessage[];
}

export interface MQTTDiscoveryDebugInfo {
  topic: string;
  payload: string;
}

export interface MQTTEntityDebugInfo {
  entity_id: string;
  discovery_data: MQTTDiscoveryDebugInfo;
  subscriptions: MQTTTopicDebugInfo[];
}

export interface MQTTTriggerDebugInfo {
  discovery_data: MQTTDiscoveryDebugInfo;
}

export interface MQTTDeviceDebugInfo {
  entities: MQTTEntityDebugInfo[];
  triggers: MQTTTriggerDebugInfo[];
}

export const subscribeMQTTTopic = (
  opp: OpenPeerPower,
  topic: string,
  callback: (message: MQTTMessage) => void
) =>
  opp.connection.subscribeMessage<MQTTMessage>(callback, {
    type: "mqtt/subscribe",
    topic,
  });

export const removeMQTTDeviceEntry = (
  opp: OpenPeerPower,
  deviceId: string
): Promise<void> =>
  opp.callWS({
    type: "mqtt/device/remove",
    device_id: deviceId,
  });

export const fetchMQTTDebugInfo = (
  opp: OpenPeerPower,
  deviceId: string
): Promise<MQTTDeviceDebugInfo> =>
  opp.callWS<MQTTDeviceDebugInfo>({
    type: "mqtt/device/debug_info",
    device_id: deviceId,
  });
