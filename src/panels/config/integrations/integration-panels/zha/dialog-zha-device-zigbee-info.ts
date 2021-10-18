import {
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../../../../components/ha-code-editor";
import { createCloseHeading } from "../../../../../components/op-dialog";
import { haStyleDialog } from "../../../../../resources/styles";
import { OpenPeerPower } from "../../../../../types";
import { ZHADeviceZigbeeInfoDialogParams } from "./show-dialog-zop-device-zigbee-info";

@customElement("dialog-zop-device-zigbee-info")
class DialogZHADeviceZigbeeInfo extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _signature: any;

  public async showDialog(
    params: ZHADeviceZigbeeInfoDialogParams
  ): Promise<void> {
    this._signature = JSON.stringify(
      {
        ...params.device.signature,
        manufacturer: params.device.manufacturer,
        model: params.device.model,
        class: params.device.quirk_class,
      },
      null,
      2
    );
  }

  protected render(): TemplateResult {
    if (!this._signature) {
      return html``;
    }

    return html`
      <op-dialog
        open
        hideActions
        @closing="${this._close}"
        .heading=${createCloseHeading(
          this.opp,
          this.opp.localize(`ui.dialogs.zha_device_info.device_signature`)
        )}
      >
        <op-code-editor mode="yaml" readonly .value=${this._signature}>
        </op-code-editor>
      </op-dialog>
    `;
  }

  private _close(): void {
    this._signature = undefined;
  }

  static get styles(): CSSResult {
    return haStyleDialog;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-zop-device-zigbee-info": DialogZHADeviceZigbeeInfo;
  }
}
