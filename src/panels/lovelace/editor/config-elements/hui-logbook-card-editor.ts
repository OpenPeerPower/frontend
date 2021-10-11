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
import { array, assert, number, object, optional, string } from "superstruct";
import { fireEvent } from "../../../../common/dom/fire_event";
import "../../../../components/entity/op-entities-picker";
import "../../../../components/entity/op-entity-picker";
import { OpenPeerPower } from "../../../../types";
import { LogbookCardConfig } from "../../cards/types";
import "../../components/hui-entity-editor";
import "../../components/hui-theme-select-editor";
import { LovelaceCardEditor } from "../../types";
import { EditorTarget } from "../types";
import { configElementStyle } from "./config-elements-style";

const cardConfigStruct = object({
  type: string(),
  entities: optional(array(string())),
  title: optional(string()),
  hours_to_show: optional(number()),
  theme: optional(string()),
});

@customElement("hui-logbook-card-editor")
export class HuiLogbookCardEditor
  extends LitElement
  implements LovelaceCardEditor
{
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: LogbookCardConfig;

  @internalProperty() private _configEntities?: string[];

  public setConfig(config: LogbookCardConfig): void {
    assert(config, cardConfigStruct);
    this._config = config;
    this._configEntities = config.entities;
  }

  get _title(): string {
    return this._config!.title || "";
  }

  get _entities(): string[] {
    return this._config!.entities || [];
  }

  get _hours_to_show(): number {
    return this._config!.hours_to_show || 24;
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
        <paper-input
          .label="${this.opp.localize(
            "ui.panel.lovelace.editor.card.generic.title"
          )} (${this.opp.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .value=${this._title}
          .configValue=${"title"}
          @value-changed=${this._valueChanged}
        ></paper-input>
        <div class="side-by-side">
          <hui-theme-select-editor
            .opp=${this.opp}
            .value=${this._theme}
            .configValue=${"theme"}
            @value-changed=${this._valueChanged}
          ></hui-theme-select-editor>
          <paper-input
            type="number"
            .label="${this.opp.localize(
              "ui.panel.lovelace.editor.card.generic.hours_to_show"
            )} (${this.opp.localize(
              "ui.panel.lovelace.editor.card.config.optional"
            )})"
            .value=${this._hours_to_show}
            .configValue=${"hours_to_show"}
            @value-changed=${this._valueChanged}
          ></paper-input>
        </div>
        <h3>
          ${`${this.opp!.localize(
            "ui.panel.lovelace.editor.card.generic.entities"
          )} (${this.opp!.localize(
            "ui.panel.lovelace.editor.card.config.required"
          )})`}
        </h3>
        <op-entities-picker
          .opp=${this.opp}
          .value=${this._configEntities}
          @value-changed=${this._valueChanged}
        >
        </op-entities-picker>
      </div>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    if (!this._config || !this.opp) {
      return;
    }
    const target = ev.target! as EditorTarget;

    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (ev.detail && ev.detail.value && Array.isArray(ev.detail.value)) {
      this._config = { ...this._config, entities: ev.detail.value };
    } else if (target.configValue) {
      if (target.value === "") {
        this._config = { ...this._config };
        delete this._config[target.configValue!];
      } else {
        let value: any = target.value;

        if (target.type === "number") {
          value = Number(value);
        }

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
    "hui-logbook-card-editor": HuiLogbookCardEditor;
  }
}
