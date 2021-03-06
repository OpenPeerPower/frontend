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
import "../../../../components/entity/ha-entity-picker";
import { OpenPeerPower } from "../../../../types";
import { HumidifierCardConfig } from "../../cards/types";
import "../../components/hui-theme-select-editor";
import { LovelaceCardEditor } from "../../types";
import { EditorTarget, EntitiesEditorEvent } from "../types";
import { configElementStyle } from "./config-elements-style";

const cardConfigStruct = object({
  type: string(),
  entity: optional(string()),
  name: optional(string()),
  theme: optional(string()),
});

const includeDomains = ["humidifier"];

@customElement("hui-humidifier-card-editor")
export class HuiHumidifierCardEditor extends LitElement
  implements LovelaceCardEditor {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: HumidifierCardConfig;

  public setConfig(config: HumidifierCardConfig): void {
    assert(config, cardConfigStruct);
    this._config = config;
  }

  get _entity(): string {
    return this._config!.entity || "";
  }

  get _name(): string {
    return this._config!.name || "";
  }

  get _theme(): string {
    return this._config!.theme || "";
  }

  protected render(): TemplateResult {
    if (!this.opp || !this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <ha-entity-picker
          .label="${this.opp.localize(
            "ui.panel.lovelace.editor.card.generic.entity"
          )} (${this.opp.localize(
            "ui.panel.lovelace.editor.card.config.required"
          )})"
          .opp=${this.opp}
          .value="${this._entity}"
          .configValue=${"entity"}
          .includeDomains=${includeDomains}
          @change="${this._valueChanged}"
          allow-custom-entity
        ></ha-entity-picker>
        <paper-input
          .label="${this.opp.localize(
            "ui.panel.lovelace.editor.card.generic.name"
          )} (${this.opp.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .value="${this._name}"
          .configValue="${"name"}"
          @value-changed="${this._valueChanged}"
        ></paper-input>
        <hui-theme-select-editor
          .opp=${this.opp}
          .value="${this._theme}"
          .configValue="${"theme"}"
          @value-changed="${this._valueChanged}"
        ></hui-theme-select-editor>
      </div>
    `;
  }

  private _valueChanged(ev: EntitiesEditorEvent): void {
    if (!this._config || !this.opp) {
      return;
    }
    const target = ev.target! as EditorTarget;

    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === "") {
        this._config = { ...this._config };
        delete this._config[target.configValue!];
      } else {
        this._config = { ...this._config, [target.configValue!]: target.value };
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
    "hui-humidifier-card-editor": HuiHumidifierCardEditor;
  }
}
