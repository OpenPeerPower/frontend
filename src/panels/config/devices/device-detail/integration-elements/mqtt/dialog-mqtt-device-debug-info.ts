import "@material/mwc-button/mwc-button";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators";
import { computeStateName } from "../../../../../../common/entity/compute_state_name";
import { computeRTLDirection } from "../../../../../../common/util/compute_rtl";
import "../../../../../../components/op-dialog";
import "../../../../../../components/op-formfield";
import "../../../../../../components/op-switch";
import type { HaSwitch } from "../../../../../../components/op-switch";
import { computeDeviceName } from "../../../../../../data/device_registry";
import {
  fetchMQTTDebugInfo,
  MQTTDeviceDebugInfo,
} from "../../../../../../data/mqtt";
import { haStyleDialog } from "../../../../../../resources/styles";
import { OpenPeerPower } from "../../../../../../types";
import "./mqtt-discovery-payload";
import "./mqtt-messages";
import { MQTTDeviceDebugInfoDialogParams } from "./show-dialog-mqtt-device-debug-info";

@customElement("dialog-mqtt-device-debug-info")
class DialogMQTTDeviceDebugInfo extends LitElement {
  public opp!: OpenPeerPower;

  @state() private _params?: MQTTDeviceDebugInfoDialogParams;

  @state() private _debugInfo?: MQTTDeviceDebugInfo;

  @state() private _showAsYaml = true;

  @state() private _showDeserialized = true;

  public async showDialog(
    params: MQTTDeviceDebugInfoDialogParams
  ): Promise<void> {
    this._params = params;
    fetchMQTTDebugInfo(this.opp, params.device.id).then((results) => {
      this._debugInfo = results;
    });
  }

  protected render(): TemplateResult {
    if (!this._params || !this._debugInfo) {
      return html``;
    }

    const dir = computeRTLDirection(this.opp!);

    return html`
      <op-dialog
        open
        @closed=${this._close}
        .heading="${this.opp!.localize(
          "ui.dialogs.mqtt_device_debug_info.title",
          "device",
          computeDeviceName(this._params.device, this.opp)
        )}"
      >
        <h4>
          ${this.opp!.localize(
            "ui.dialogs.mqtt_device_debug_info.payload_display"
          )}
        </h4>
        <div>
          <op-formfield
            .label=${this.opp!.localize(
              "ui.dialogs.mqtt_device_debug_info.deserialize"
            )}
            .dir=${dir}
          >
            <op-switch
              .checked=${this._showDeserialized}
              @change=${this._showDeserializedChanged}
            >
            </op-switch>
          </op-formfield>
        </div>
        <div>
          <op-formfield
            .label=${this.opp!.localize(
              "ui.dialogs.mqtt_device_debug_info.show_as_yaml"
            )}
            .dir=${dir}
          >
            <op-switch
              .checked=${this._showAsYaml}
              @change=${this._showAsYamlChanged}
            >
            </op-switch>
          </op-formfield>
        </div>
        <h4>
          ${this.opp!.localize("ui.dialogs.mqtt_device_debug_info.entities")}
        </h4>
        <ul class="entitylist">
          ${this._debugInfo.entities.length
            ? this._renderEntities()
            : html`
                ${this.opp!.localize(
                  "ui.dialogs.mqtt_device_debug_info.no_entities"
                )}
              `}
        </ul>
        <h4>
          ${this.opp!.localize("ui.dialogs.mqtt_device_debug_info.triggers")}
        </h4>
        <ul class="triggerlist">
          ${this._debugInfo.triggers.length
            ? this._renderTriggers()
            : html`
                ${this.opp!.localize(
                  "ui.dialogs.mqtt_device_debug_info.no_triggers"
                )}
              `}
        </ul>
        <mwc-button slot="primaryAction" @click=${this._close}>
          ${this.opp!.localize("ui.dialogs.generic.close")}
        </mwc-button>
      </op-dialog>
    `;
  }

  private _close(): void {
    this._params = undefined;
    this._debugInfo = undefined;
  }

  private _showAsYamlChanged(ev: Event): void {
    this._showAsYaml = (ev.target as HaSwitch).checked;
  }

  private _showDeserializedChanged(ev: Event): void {
    this._showDeserialized = (ev.target as HaSwitch).checked;
  }

  private _renderEntities(): TemplateResult {
    return html`
      ${this._debugInfo!.entities.map(
        (entity) => html`
          <li class="entitylistitem">
            '${computeStateName(this.opp.states[entity.entity_id])}'
            (<code>${entity.entity_id}</code>)
            <br />MQTT discovery data:
            <ul class="discoverydata">
              <li>
                Topic:
                <code>${entity.discovery_data.topic}</code>
              </li>
              <li>
                <mqtt-discovery-payload
                  .opp=${this.opp}
                  .payload=${entity.discovery_data.payload}
                  .showAsYaml=${this._showAsYaml}
                  .summary=${"Payload"}
                >
                </mqtt-discovery-payload>
              </li>
            </ul>
            Subscribed topics:
            <ul>
              ${entity.subscriptions.map(
                (topic) => html`
                  <li>
                    <code>${topic.topic}</code>
                    <mqtt-messages
                      .opp=${this.opp}
                      .messages=${topic.messages}
                      .showDeserialized=${this._showDeserialized}
                      .showAsYaml=${this._showAsYaml}
                      .subscribedTopic=${topic.topic}
                      .summary=${this.opp!.localize(
                        "ui.dialogs.mqtt_device_debug_info.recent_messages",
                        "n",
                        topic.messages.length
                      )}
                    >
                    </mqtt-messages>
                  </li>
                `
              )}
            </ul>
          </li>
        `
      )}
    `;
  }

  private _renderTriggers(): TemplateResult {
    return html`
      ${this._debugInfo!.triggers.map(
        (trigger) => html`
          <li class="triggerlistitem">
            MQTT discovery data:
            <ul class="discoverydata">
              <li>
                Topic:
                <code>${trigger.discovery_data.topic}</code>
              </li>
              <li>
                <mqtt-discovery-payload
                  .opp=${this.opp}
                  .payload=${trigger.discovery_data.payload}
                  .showAsYaml=${this._showAsYaml}
                  .summary=${"Payload"}
                >
                </mqtt-discovery-payload>
              </li>
            </ul>
          </li>
        `
      )}
    `;
  }

  static get styles(): CSSResultGroup {
    return [
      haStyleDialog,
      css`
        op-dialog {
          --mdc-dialog-max-width: 95%;
          --mdc-dialog-min-width: 640px;
        }
        op-switch {
          margin: 16px;
        }
        .discoverydata {
          list-style-type: none;
          margin: 4px;
          padding-left: 16px;
        }
        .entitylistitem {
          margin-bottom: 12px;
        }
        .triggerlistitem {
          margin-bottom: 12px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-mqtt-device-debug-info": DialogMQTTDeviceDebugInfo;
  }
}
