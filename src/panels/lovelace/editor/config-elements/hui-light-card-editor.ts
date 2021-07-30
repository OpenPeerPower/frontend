import "@polymer/paper-input/paper-input";
import {
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { assert, object, optional, string } from "superstruct";
import { fireEvent } from "../../../../common/dom/fire_event";
import { stateIcon } from "../../../../common/entity/state_icon";
import "../../../../components/ha-icon-input";
import { ActionConfig } from "../../../../data/lovelace";
import { OpenPeerPower } from "../../../../types";
import { LightCardConfig } from "../../cards/types";
import "../../components/hui-action-editor";
import "../../components/hui-entity-editor";
import "../../components/hui-theme-select-editor";
import { LovelaceCardEditor } from "../../types";
import { actionConfigStruct, EditorTarget } from "../types";
import { configElementStyle } from "./config-elements-style";

const cardConfigStruct = object({
  type: string(),
  name: optional(string()),
  entity: optional(string()),
  theme: optional(string()),
  icon: optional(string()),
  hold_action: optional(actionConfigStruct),
  double_tap_action: optional(actionConfigStruct),
});

const includeDomains = ["light"];

@customElement("hui-light-card-editor")
export class HuiLightCardEditor
  extends LitElement
  implements LovelaceCardEditor
{
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: LightCardConfig;

  public setConfig(config: LightCardConfig): void {
    assert(config, cardConfigStruct);
    this._config = config;
  }

  get _name(): string {
    return this._config!.name || "";
  }

  get _theme(): string {
    return this._config!.theme || "";
  }

  get _entity(): string {
    return this._config!.entity || "";
  }

  get _icon(): string {
    return this._config!.icon || "";
  }

  get _hold_action(): ActionConfig {
    return this._config!.hold_action || { action: "more-info" };
  }

  get _double_tap_action(): ActionConfig | undefined {
    return this._config!.double_tap_action;
  }

  protected render(): TemplateResult {
    if (!this.opp || !this._config) {
      return html``;
    }

    const actions = [
      "more-info",
      "toggle",
      "navigate",
      "url",
      "call-service",
      "none",
    ];

    return html`
      <div class="card-config">
        <op-entity-picker
          .label="${this.opp.localize(
            "ui.panel.lovelace.editor.card.generic.entity"
          )} (${this.opp.localize(
            "ui.panel.lovelace.editor.card.config.required"
          )})"
          .opp=${this.opp}
          .value=${this._entity}
          .configValue=${"entity"}
          .includeDomains=${includeDomains}
          @value-changed=${this._valueChanged}
          allow-custom-entity
        ></op-entity-picker>
        <div class="side-by-side">
          <paper-input
            .label="${this.opp.localize(
              "ui.panel.lovelace.editor.card.generic.name"
            )} (${this.opp.localize(
              "ui.panel.lovelace.editor.card.config.optional"
            )})"
            .value=${this._name}
            .configValue=${"name"}
            @value-changed=${this._valueChanged}
          ></paper-input>
          <op-icon-input
            .label="${this.opp.localize(
              "ui.panel.lovelace.editor.card.generic.icon"
            )} (${this.opp.localize(
              "ui.panel.lovelace.editor.card.config.optional"
            )})"
            .value=${this._icon}
            .placeholder=${this._icon ||
            stateIcon(this.opp.states[this._entity])}
            .configValue=${"icon"}
            @value-changed=${this._valueChanged}
          ></op-icon-input>
        </div>

        <hui-theme-select-editor
          .opp=${this.opp}
          .value=${this._theme}
          .configValue=${"theme"}
          @value-changed=${this._valueChanged}
        ></hui-theme-select-editor>

        <hui-action-editor
          .label="${this.opp.localize(
            "ui.panel.lovelace.editor.card.generic.hold_action"
          )} (${this.opp.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .opp=${this.opp}
          .config=${this._hold_action}
          .actions=${actions}
          .configValue=${"hold_action"}
          @value-changed=${this._valueChanged}
        ></hui-action-editor>

        <hui-action-editor
          .label="${this.opp.localize(
            "ui.panel.lovelace.editor.card.generic.double_tap_action"
          )} (${this.opp.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .opp=${this.opp}
          .config=${this._double_tap_action}
          .actions=${actions}
          .configValue=${"double_tap_action"}
          @value-changed=${this._valueChanged}
        ></hui-action-editor>
      </div>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    if (!this._config || !this.opp) {
      return;
    }
    const target = ev.target! as EditorTarget;
    const value = ev.detail.value;

    if (this[`_${target.configValue}`] === value) {
      return;
    }
    if (target.configValue) {
      if (value !== false && !value) {
        this._config = { ...this._config };
        delete this._config[target.configValue!];
      } else {
        this._config = {
          ...this._config,
          [target.configValue!]: value,
        };
      }
    }
    fireEvent(this, "config-changed", { config: this._config });
  }

  static get styles(): CSSResult {
    return configElementStyle;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-light-card-editor": HuiLightCardEditor;
  }
}
