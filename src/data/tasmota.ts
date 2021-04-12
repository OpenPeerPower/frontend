import { OpenPeerPower } from "../types";

export const removeTasmotaDeviceEntry = (
  opp: OpenPeerPower,
  deviceId: string
): Promise<void> =>
  opp.callWS({
    type: "tasmota/device/remove",
    device_id: deviceId,
  });
