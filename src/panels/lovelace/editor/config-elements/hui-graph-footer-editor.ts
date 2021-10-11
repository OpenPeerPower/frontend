import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
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
import { assert } from "superstruct";
import { fireEvent, OPPDomEvent } from "../../../../common/dom/fire_event";
import "../../../../components/entity/op-entity-picker";
import "../../../../components/ha-formfield";
import "../../../../components/ha-switch";
import type { OpenPeerPower } from "../../../../types";
import {
  GraphHeaderFooterConfig,
  graphHeaderFooterConfigStruct,
} from "../../header-footer/types";
import type { LovelaceCardEditor } from "../../types";
import type { EditorTarget, EntitiesEditorEvent } from "../types";
import { configElementStyle } from "./config-elements-style";

const includeDomains = ["sensor"];

@customElement("hui-graph-footer-editor")
export class HuiGraphFooterEditor
  extends LitElement
  implements LovelaceCardEditor
{
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: GraphHeaderFooterConfig;

  public setConfig(config: GraphHeaderFooterConfig): void {
    assert(config, graphHeaderFooterConfigStruct);
    this._config = config;
  }

  get _entity(): string {
    return this._config!.entity || "";
  }

  get _detail(): number {
    return this._config!.detail ?? 1;
  }

  get _hours_to_show(): number {
    return this._config!.hours_to_show || 24;
  }

  protected render(): TemplateResult {
    if (!this.opp || !this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <op-entity-picker
          allow-custom-entity
          .label="${this.opp.localize(
            "ui.panel.lovelace.editor.card.generic.entity"
          )} (${this.opp.localize(
            "ui.panel.lovelace.editor.card.config.required"
          )})"
          .opp=${this.opp}
          .value=${this._entity}
          .configValue=${"entity"}
          .includeDomains=${includeDomains}
          @change=${this._valueChanged}
        ></op-entity-picker>
        <div class="side-by-side">
          <op-formfield
            label=${this.opp.localize(
              "ui.panel.lovelace.editor.card.sensor.show_more_detail"
            )}
          >
            <op-switch
              .checked=${this._detail === 2}
              .configValue=${"detail"}
              @change=${this._change}
            ></op-switch>
          </op-formfield>
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
      </div>
    `;
  }

  private _change(ev: Event) {
    if (!this._config || !this.opp) {
      return;
    }

    const value = (ev.target! as EditorTarget).checked ? 2 : 1;

    if (this._detail === value) {
      return;
    }

    this._config = {
      ...this._config,
      detail: value,
    };

    fireEvent(this, "config-changed", { config: this._config });
  }

  private _valueChanged(ev: OPPDomEvent<EntitiesEditorEvent>): void {
    if (!this._config || !this.opp) {
      return;
    }
    const target = ev.target! as EditorTarget;

    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (
        target.value === "" ||
        (target.type === "number" && isNaN(Number(target.value)))
      ) {
        this._config = { ...this._config };
        delete this._config[target.configValue!];
      } else {
        let value: any = target.value;
        if (target.type === "number") {
          value = Number(value);
        }
        this._config = { ...this._config, [target.configValue!]: value };
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
    "hui-graph-footer-editor": HuiGraphFooterEditor;
  }
}
