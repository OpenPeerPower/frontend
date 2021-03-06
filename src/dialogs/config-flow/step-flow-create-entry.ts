import "@material/mwc-button";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu-light";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import {
  css,
  CSSResultArray,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../common/dom/fire_event";
import "../../components/ha-area-picker";
import { DataEntryFlowStepCreateEntry } from "../../data/data_entry_flow";
import {
  DeviceRegistryEntry,
  updateDeviceRegistryEntry,
} from "../../data/device_registry";
import { OpenPeerPower } from "../../types";
import { showAlertDialog } from "../generic/show-dialog-box";
import { FlowConfig } from "./show-dialog-data-entry-flow";
import { configFlowContentStyles } from "./styles";

@customElement("step-flow-create-entry")
class StepFlowCreateEntry extends LitElement {
  public flowConfig!: FlowConfig;

  @property()
  public opp!: OpenPeerPower;

  @property()
  public step!: DataEntryFlowStepCreateEntry;

  @property()
  public devices!: DeviceRegistryEntry[];

  protected render(): TemplateResult {
    const localize = this.opp.localize;

    return html`
      <h2>Success!</h2>
      <div class="content">
        ${this.flowConfig.renderCreateEntryDescription(this.opp, this.step)}
        ${this.step.result?.state === "not_loaded"
          ? html`<span class="error"
              >${localize(
                "ui.panel.config.integrations.config_flow.not_loaded"
              )}</span
            >`
          : ""}
        ${this.devices.length === 0
          ? ""
          : html`
              <p>We found the following devices:</p>
              <div class="devices">
                ${this.devices.map(
                  (device) =>
                    html`
                      <div class="device">
                        <div>
                          <b>${device.name}</b><br />
                          ${device.model} (${device.manufacturer})
                        </div>
                        <ha-area-picker
                          .opp=${this.opp}
                          .device=${device.id}
                          @value-changed=${this._areaPicked}
                        ></ha-area-picker>
                      </div>
                    `
                )}
              </div>
            `}
      </div>
      <div class="buttons">
        <mwc-button @click="${this._flowDone}"
          >${localize(
            "ui.panel.config.integrations.config_flow.finish"
          )}</mwc-button
        >
      </div>
    `;
  }

  private _flowDone(): void {
    fireEvent(this, "flow-update", { step: undefined });
  }

  private async _areaPicked(ev: CustomEvent) {
    const picker = ev.currentTarget as any;
    const device = picker.device;

    const area = ev.detail.value;
    try {
      await updateDeviceRegistryEntry(this.opp, device, {
        area_id: area,
      });
    } catch (err) {
      showAlertDialog(this, {
        text: this.opp.localize(
          "ui.panel.config.integrations.config_flow.error_saving_area",
          "error",
          err.message
        ),
      });
      picker.value = null;
    }
  }

  static get styles(): CSSResultArray {
    return [
      configFlowContentStyles,
      css`
        .devices {
          display: flex;
          flex-wrap: wrap;
          margin: -4px;
          max-height: 600px;
          overflow-y: auto;
        }
        .device {
          border: 1px solid var(--divider-color);
          padding: 5px;
          border-radius: 4px;
          margin: 4px;
          display: inline-block;
          width: 250px;
        }
        .buttons > *:last-child {
          margin-left: auto;
        }
        paper-dropdown-menu-light {
          cursor: pointer;
        }
        paper-item {
          cursor: pointer;
          white-space: nowrap;
        }
        @media all and (max-width: 450px), all and (max-height: 500px) {
          .device {
            width: 100%;
          }
        }
        .error {
          color: var(--error-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "step-flow-create-entry": StepFlowCreateEntry;
  }
}
