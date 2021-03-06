import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { navigate } from "../../../../../../common/navigate";
import { DeviceRegistryEntry } from "../../../../../../data/device_registry";
import { fetchZHADevice, ZHADevice } from "../../../../../../data/zha";
import { showConfirmationDialog } from "../../../../../../dialogs/generic/show-dialog-box";
import { haStyle } from "../../../../../../resources/styles";
import { OpenPeerPower } from "../../../../../../types";
import { showZHAClusterDialog } from "../../../../integrations/integration-panels/zha/show-dialog-zha-cluster";
import { showZHADeviceZigbeeInfoDialog } from "../../../../integrations/integration-panels/zha/show-dialog-zha-device-zigbee-info";
import { showZHAReconfigureDeviceDialog } from "../../../../integrations/integration-panels/zha/show-dialog-zha-reconfigure-device";
import { showZHADeviceChildrenDialog } from "../../../../integrations/integration-panels/zha/show-dialog-zha-device-children";

@customElement("ha-device-actions-zha")
export class HaDeviceActionsZha extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public device!: DeviceRegistryEntry;

  @internalProperty() private _zhaDevice?: ZHADevice;

  protected updated(changedProperties: PropertyValues) {
    if (changedProperties.has("device")) {
      const zigbeeConnection = this.device.connections.find(
        (conn) => conn[0] === "zigbee"
      );
      if (!zigbeeConnection) {
        return;
      }
      fetchZHADevice(this.opp, zigbeeConnection[1]).then((device) => {
        this._zhaDevice = device;
      });
    }
  }

  protected render(): TemplateResult {
    if (!this._zhaDevice) {
      return html``;
    }
    return html`
      ${this._zhaDevice.device_type !== "Coordinator"
        ? html`
            <mwc-button @click=${this._onReconfigureNodeClick}>
              ${this.opp!.localize(
                "ui.dialogs.zha_device_info.buttons.reconfigure"
              )}
            </mwc-button>
          `
        : ""}
      ${this._zhaDevice.power_source === "Mains" &&
      (this._zhaDevice.device_type === "Router" ||
        this._zhaDevice.device_type === "Coordinator")
        ? html`
            <mwc-button @click=${this._onAddDevicesClick}>
              ${this.opp!.localize("ui.dialogs.zha_device_info.buttons.add")}
            </mwc-button>
            <mwc-button @click=${this._handleDeviceChildrenClicked}>
              ${this.opp!.localize(
                "ui.dialogs.zha_device_info.buttons.device_children"
              )}
            </mwc-button>
          `
        : ""}
      ${this._zhaDevice.device_type !== "Coordinator"
        ? html`
            <mwc-button @click=${this._handleZigbeeInfoClicked}>
              ${this.opp!.localize(
                "ui.dialogs.zha_device_info.buttons.zigbee_information"
              )}
            </mwc-button>
            <mwc-button @click=${this._showClustersDialog}>
              ${this.opp!.localize(
                "ui.dialogs.zha_device_info.buttons.clusters"
              )}
            </mwc-button>
            <mwc-button @click=${this._onViewInVisualizationClick}>
              ${this.opp!.localize(
                "ui.dialogs.zha_device_info.buttons.view_in_visualization"
              )}
            </mwc-button>
            <mwc-button class="warning" @click=${this._removeDevice}>
              ${this.opp!.localize(
                "ui.dialogs.zha_device_info.buttons.remove"
              )}
            </mwc-button>
          `
        : ""}
    `;
  }

  private async _showClustersDialog(): Promise<void> {
    await showZHAClusterDialog(this, { device: this._zhaDevice! });
  }

  private async _onReconfigureNodeClick(): Promise<void> {
    if (!this.opp) {
      return;
    }
    showZHAReconfigureDeviceDialog(this, { device: this._zhaDevice! });
  }

  private _onAddDevicesClick() {
    navigate(this, "/config/zha/add/" + this._zhaDevice!.ieee);
  }

  private _onViewInVisualizationClick() {
    navigate(
      this,
      "/config/zha/visualization/" + this._zhaDevice!.device_reg_id
    );
  }

  private async _handleZigbeeInfoClicked() {
    showZHADeviceZigbeeInfoDialog(this, { device: this._zhaDevice! });
  }

  private async _handleDeviceChildrenClicked() {
    showZHADeviceChildrenDialog(this, { device: this._zhaDevice! });
  }

  private async _removeDevice() {
    const confirmed = await showConfirmationDialog(this, {
      text: this.opp.localize(
        "ui.dialogs.zha_device_info.confirmations.remove"
      ),
    });

    if (!confirmed) {
      return;
    }

    await this.opp.callService("zha", "remove", {
      ieee: this._zhaDevice!.ieee,
    });

    history.back();
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        :host {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
      `,
    ];
  }
}
