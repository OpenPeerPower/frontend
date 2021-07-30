import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-input/paper-input";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import {
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { assert, boolean, object, optional, string } from "superstruct";
import { fireEvent } from "../../../../common/dom/fire_event";
import { computeRTLDirection } from "../../../../common/util/compute_rtl";
import "../../../../components/ha-formfield";
import "../../../../components/ha-switch";
import { ActionConfig } from "../../../../data/lovelace";
import { OpenPeerPower } from "../../../../types";
import { PictureEntityCardConfig } from "../../cards/types";
import "../../components/hui-action-editor";
import "../../components/hui-entity-editor";
import "../../components/hui-theme-select-editor";
import { LovelaceCardEditor } from "../../types";
import { actionConfigStruct, EditorTarget } from "../types";
import { configElementStyle } from "./config-elements-style";

const cardConfigStruct = object({
  type: string(),
  entity: optional(string()),
  image: optional(string()),
  name: optional(string()),
  camera_image: optional(string()),
  camera_view: optional(string()),
  aspect_ratio: optional(string()),
  tap_action: optional(actionConfigStruct),
  hold_action: optional(actionConfigStruct),
  show_name: optional(boolean()),
  show_state: optional(boolean()),
  theme: optional(string()),
});

const includeDomains = ["camera"];

@customElement("hui-picture-entity-card-editor")
export class HuiPictureEntityCardEditor
  extends LitElement
  implements LovelaceCardEditor
{
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: PictureEntityCardConfig;

  public setConfig(config: PictureEntityCardConfig): void {
    assert(config, cardConfigStruct);
    this._config = config;
  }

  get _entity(): string {
    return this._config!.entity || "";
  }

  get _name(): string {
    return this._config!.name || "";
  }

  get _image(): string {
    return this._config!.image || "";
  }

  get _camera_image(): string {
    return this._config!.camera_image || "";
  }

  get _camera_view(): string {
    return this._config!.camera_view || "auto";
  }

  get _aspect_ratio(): string {
    return this._config!.aspect_ratio || "";
  }

  get _tap_action(): ActionConfig {
    return this._config!.tap_action || { action: "more-info" };
  }

  get _hold_action(): ActionConfig | undefined {
    return this._config!.hold_action;
  }

  get _show_name(): boolean {
    return this._config!.show_name ?? true;
  }

  get _show_state(): boolean {
    return this._config!.show_state ?? true;
  }

  get _theme(): string {
    return this._config!.theme || "";
  }

  protected render(): TemplateResult {
    if (!this.opp || !this._config) {
      return html``;
    }

    const actions = ["more-info", "toggle", "navigate", "call-service", "none"];
    const views = ["auto", "live"];
    const dir = computeRTLDirection(this.opp!);

    return html`
      <div class="card-config">
        <op-entity-picker
          .label="${this.opp.localize(
            "ui.panel.lovelace.editor.card.generic.entity"
          )} (${this.opp.localize(
            "ui.panel.lovelace.editor.card.config.required"
          )})"
          .opp=${this.opp}
          .value="${this._entity}"
          .configValue=${"entity"}
          @value-changed="${this._valueChanged}"
          allow-custom-entity
        ></op-entity-picker>
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
        <paper-input
          .label="${this.opp.localize(
            "ui.panel.lovelace.editor.card.generic.image"
          )} (${this.opp.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .value="${this._image}"
          .configValue="${"image"}"
          @value-changed="${this._valueChanged}"
        ></paper-input>
        <op-entity-picker
          .label="${this.opp.localize(
            "ui.panel.lovelace.editor.card.generic.camera_image"
          )} (${this.opp.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .opp=${this.opp}
          .value="${this._camera_image}"
          .configValue=${"camera_image"}
          @value-changed="${this._valueChanged}"
          .includeDomains=${includeDomains}
          allow-custom-entity
        ></op-entity-picker>
        <div class="side-by-side">
          <paper-dropdown-menu
            .label="${this.opp.localize(
              "ui.panel.lovelace.editor.card.generic.camera_view"
            )} (${this.opp.localize(
              "ui.panel.lovelace.editor.card.config.optional"
            )})"
            .configValue="${"camera_view"}"
            @value-changed="${this._valueChanged}"
          >
            <paper-listbox
              slot="dropdown-content"
              .selected="${views.indexOf(this._camera_view)}"
            >
              ${views.map((view) => {
                return html` <paper-item>${view}</paper-item> `;
              })}
            </paper-listbox>
          </paper-dropdown-menu>
          <paper-input
            .label="${this.opp.localize(
              "ui.panel.lovelace.editor.card.generic.aspect_ratio"
            )} (${this.opp.localize(
              "ui.panel.lovelace.editor.card.config.optional"
            )})"
            .value="${this._aspect_ratio}"
            .configValue="${"aspect_ratio"}"
            @value-changed="${this._valueChanged}"
          ></paper-input>
        </div>
        <div class="side-by-side">
          <div>
            <op-formfield
              .label=${this.opp.localize(
                "ui.panel.lovelace.editor.card.generic.show_name"
              )}
              .dir=${dir}
            >
              <op-switch
                .checked="${this._config!.show_name !== false}"
                .configValue="${"show_name"}"
                @change="${this._change}"
              ></op-switch
            ></op-formfield>
          </div>
          <div>
            <op-formfield
              .label=${this.opp.localize(
                "ui.panel.lovelace.editor.card.generic.show_state"
              )}
              .dir=${dir}
            >
              <op-switch
                .checked="${this._config!.show_state !== false}"
                .configValue="${"show_state"}"
                @change="${this._change}"
              ></op-switch
            ></op-formfield>
          </div>
        </div>
        <hui-theme-select-editor
          .opp=${this.opp}
          .value="${this._theme}"
          .configValue="${"theme"}"
          @value-changed="${this._valueChanged}"
        ></hui-theme-select-editor>
        <div class="side-by-side">
          <hui-action-editor
            .label="${this.opp.localize(
              "ui.panel.lovelace.editor.card.generic.tap_action"
            )} (${this.opp.localize(
              "ui.panel.lovelace.editor.card.config.optional"
            )})"
            .opp=${this.opp}
            .config="${this._tap_action}"
            .actions="${actions}"
            .configValue="${"tap_action"}"
            @value-changed="${this._valueChanged}"
          ></hui-action-editor>
          <hui-action-editor
            .label="${this.opp.localize(
              "ui.panel.lovelace.editor.card.generic.hold_action"
            )} (${this.opp.localize(
              "ui.panel.lovelace.editor.card.config.optional"
            )})"
            .opp=${this.opp}
            .config="${this._hold_action}"
            .actions="${actions}"
            .configValue="${"hold_action"}"
            @value-changed="${this._valueChanged}"
          ></hui-action-editor>
        </div>
      </div>
    `;
  }

  private _change(ev: Event) {
    if (!this._config || !this.opp) {
      return;
    }
    const target = ev.target! as EditorTarget;
    const value = target.checked;

    if (this[`_${target.configValue}`] === value) {
      return;
    }

    this._config = {
      ...this._config,
      [target.configValue!]: value,
    };
    fireEvent(this, "config-changed", { config: this._config });
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
    "hui-picture-entity-card-editor": HuiPictureEntityCardEditor;
  }
}
