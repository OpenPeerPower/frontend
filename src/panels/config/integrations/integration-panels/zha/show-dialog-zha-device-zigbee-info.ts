import { fireEvent } from "../../../../../common/dom/fire_event";
import { ZHADevice } from "../../../../../data/zha";

export interface ZHADeviceZigbeeInfoDialogParams {
  device: ZHADevice;
}

export const loadZHADeviceZigbeeInfoDialog = () =>
  import("./dialog-zop-device-zigbee-info");

export const showZHADeviceZigbeeInfoDialog = (
  element: HTMLElement,
  zhaDeviceZigbeeInfoParams: ZHADeviceZigbeeInfoDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "dialog-zop-device-zigbee-info",
    dialogImport: loadZHADeviceZigbeeInfoDialog,
    dialogParams: zhaDeviceZigbeeInfoParams,
  });
};
