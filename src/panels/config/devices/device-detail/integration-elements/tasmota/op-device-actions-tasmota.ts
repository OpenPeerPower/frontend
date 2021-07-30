import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import { DeviceRegistryEntry } from "../../../../../../data/device_registry";
import { removeTasmotaDeviceEntry } from "../../../../../../data/tasmota";
import { showConfirmationDialog } from "../../../../../../dialogs/generic/show-dialog-box";
import { haStyle } from "../../../../../../resources/styles";
import { OpenPeerPower } from "../../../../../../types";

@customElement("ha-device-actions-tasmota")
export class HaDeviceActionsTasmota extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public device!: DeviceRegistryEntry;

  protected render(): TemplateResult {
    return html`
      <mwc-button class="warning" @click="${this._confirmDeleteEntry}">
        ${this.opp.localize("ui.panel.config.devices.delete")}
      </mwc-button>
    `;
  }

  private async _confirmDeleteEntry(): Promise<void> {
    const confirmed = await showConfirmationDialog(this, {
      text: this.opp.localize("ui.panel.config.devices.confirm_delete"),
    });

    if (!confirmed) {
      return;
    }

    await removeTasmotaDeviceEntry(this.opp!, this.device.id);
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      css`
        :host {
          display: flex;
          justify-content: space-between;
        }
      `,
    ];
  }
}
