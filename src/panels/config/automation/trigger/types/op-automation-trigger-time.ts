import "@polymer/paper-input/paper-input";
import {
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
} from "lit-element";
import "../../../../../components/entity/ha-entity-picker";
import "../../../../../components/ha-formfield";
import "../../../../../components/ha-radio";
import { TimeTrigger } from "../../../../../data/automation";
import { OpenPeerPower } from "../../../../../types";
import {
  handleChangeEvent,
  TriggerElement,
} from "../ha-automation-trigger-row";

const includeDomains = ["input_datetime"];

@customElement("ha-automation-trigger-time")
export class HaTimeTrigger extends LitElement implements TriggerElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public trigger!: TimeTrigger;

  @internalProperty() private _inputMode?: boolean;

  public static get defaultConfig() {
    return { at: "" };
  }

  protected render() {
    const { at } = this.trigger;
    const inputMode = this._inputMode ?? at?.startsWith("input_datetime.");
    return html`
      <ha-formfield
        .label=${this.opp!.localize(
          "ui.panel.config.automation.editor.triggers.type.time.type_value"
        )}
      >
        <ha-radio
          @change=${this._handleModeChanged}
          name="mode"
          value="value"
          ?checked=${!inputMode}
        ></ha-radio>
      </ha-formfield>
      <ha-formfield
        .label=${this.opp!.localize(
          "ui.panel.config.automation.editor.triggers.type.time.type_input"
        )}
      >
        <ha-radio
          @change=${this._handleModeChanged}
          name="mode"
          value="input"
          ?checked=${inputMode}
        ></ha-radio>
      </ha-formfield>
      ${inputMode
        ? html`<ha-entity-picker
            .label=${this.opp.localize(
              "ui.panel.config.automation.editor.triggers.type.time.at"
            )}
            .includeDomains=${includeDomains}
            .name=${"at"}
            .value=${at?.startsWith("input_datetime.") ? at : ""}
            @value-changed=${this._valueChanged}
            .opp=${this.opp}
            allow-custom-entity
          ></ha-entity-picker>`
        : html`<paper-input
            .label=${this.opp.localize(
              "ui.panel.config.automation.editor.triggers.type.time.at"
            )}
            name="at"
            .value=${at?.startsWith("input_datetime.") ? "" : at}
            @value-changed=${this._valueChanged}
          ></paper-input>`}
    `;
  }

  private _handleModeChanged(ev: Event) {
    this._inputMode = (ev.target as any).value === "input";
  }

  private _valueChanged(ev: CustomEvent): void {
    handleChangeEvent(this, ev);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-automation-trigger-time": HaTimeTrigger;
  }
}
