import {
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import { computeRTLDirection } from "../../../../../common/util/compute_rtl";
import "../../../../../components/op-code-editor";
import { createCloseHeading } from "../../../../../components/op-dialog";
import { haStyleDialog } from "../../../../../resources/styles";
import { OpenPeerPower } from "../../../../../types";
import { ZHADeviceChildrenDialogParams } from "./show-dialog-zha-device-children";
import "../../../../../components/data-table/op-data-table";
import type {
  DataTableColumnContainer,
  DataTableRowData,
} from "../../../../../components/data-table/op-data-table";
import "../../../../../components/op-circular-progress";
import { fetchDevices, ZHADevice } from "../../../../../data/zha";
import { fireEvent } from "../../../../../common/dom/fire_event";

export interface DeviceRowData extends DataTableRowData {
  id: string;
  name: string;
  lqi: number;
}

@customElement("dialog-zha-device-children")
class DialogZHADeviceChildren extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _device: ZHADevice | undefined;

  @internalProperty() private _devices: Map<string, ZHADevice> | undefined;

  private _deviceChildren = memoizeOne(
    (
      device: ZHADevice | undefined,
      devices: Map<string, ZHADevice> | undefined
    ) => {
      const outputDevices: DeviceRowData[] = [];
      if (device && devices) {
        device.neighbors.forEach((child) => {
          const zhaDevice: ZHADevice | undefined = devices.get(child.ieee);
          if (zhaDevice) {
            outputDevices.push({
              name: zhaDevice.user_given_name || zhaDevice.name,
              id: zhaDevice.device_reg_id,
              lqi: child.lqi,
            });
          }
        });
      }
      return outputDevices;
    }
  );

  private _columns: DataTableColumnContainer = {
    name: {
      title: "Name",
      sortable: true,
      filterable: true,
      direction: "asc",
      grows: true,
    },
    lqi: {
      title: "LQI",
      sortable: true,
      filterable: true,
      direction: "asc",
      width: "75px",
    },
  };

  public showDialog(params: ZHADeviceChildrenDialogParams): void {
    this._device = params.device;
    this._fetchData();
  }

  public closeDialog(): void {
    this._device = undefined;
    this._devices = undefined;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  protected render(): TemplateResult {
    if (!this._device) {
      return html``;
    }
    return html`
      <op-dialog
        hideActions
        open
        @closed=${this.closeDialog}
        .heading=${createCloseHeading(
          this.opp,
          this.opp.localize(`ui.dialogs.zha_device_info.device_children`)
        )}
      >
        ${!this._devices
          ? html`<op-circular-progress
              alt="Loading"
              size="large"
              active
            ></op-circular-progress>`
          : html`<op-data-table
              .columns=${this._columns}
              .data=${this._deviceChildren(this._device, this._devices)}
              auto-height
              .dir=${computeRTLDirection(this.opp)}
              .searchLabel=${this.opp.localize(
                "ui.components.data-table.search"
              )}
              .noDataText=${this.opp.localize(
                "ui.components.data-table.no-data"
              )}
            ></op-data-table>`}
      </op-dialog>
    `;
  }

  private async _fetchData(): Promise<void> {
    if (this._device && this.opp) {
      const devices = await fetchDevices(this.opp!);
      this._devices = new Map(
        devices.map((device: ZHADevice) => [device.ieee, device])
      );
    }
  }

  static get styles(): CSSResult {
    return haStyleDialog;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-zha-device-children": DialogZHADeviceChildren;
  }
}
