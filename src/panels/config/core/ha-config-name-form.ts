import "@material/mwc-button/mwc-button";
import "@polymer/paper-input/paper-input";
import type { PaperInputElement } from "@polymer/paper-input/paper-input";
import "@polymer/paper-radio-button/paper-radio-button";
import "@polymer/paper-radio-group/paper-radio-group";
import {
  css,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../../components/ha-card";
import { ConfigUpdateValues, saveCoreConfig } from "../../../data/core";
import type { PolymerChangedEvent } from "../../../polymer-types";
import type { OpenPeerPower } from "../../../types";

@customElement("ha-config-name-form")
class ConfigNameForm extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _working = false;

  @internalProperty() private _name!: ConfigUpdateValues["location_name"];

  protected render(): TemplateResult {
    const canEdit = ["storage", "default"].includes(
      this.opp.config.config_source
    );
    const disabled = this._working || !canEdit;

    return html`
      <ha-card>
        <div class="card-content">
          ${!canEdit
            ? html`
                <p>
                  ${this.opp.localize(
                    "ui.panel.config.core.section.core.core_config.edit_requires_storage"
                  )}
                </p>
              `
            : ""}
          <paper-input
            class="flex"
            .label=${this.opp.localize(
              "ui.panel.config.core.section.core.core_config.location_name"
            )}
            name="name"
            .disabled=${disabled}
            .value=${this._nameValue}
            @value-changed=${this._handleChange}
          ></paper-input>
        </div>
        <div class="card-actions">
          <mwc-button @click=${this._save} .disabled=${disabled}>
            ${this.opp.localize(
              "ui.panel.config.core.section.core.core_config.save_button"
            )}
          </mwc-button>
        </div>
      </ha-card>
    `;
  }

  private get _nameValue() {
    return this._name !== undefined
      ? this._name
      : this.opp.config.location_name;
  }

  private _handleChange(ev: PolymerChangedEvent<string>) {
    const target = ev.currentTarget as PaperInputElement;
    this[`_${target.name}`] = target.value;
  }

  private async _save() {
    this._working = true;
    try {
      await saveCoreConfig(this.opp, {
        location_name: this._nameValue,
      });
    } catch (err) {
      alert("FAIL");
    } finally {
      this._working = false;
    }
  }

  static get styles() {
    return css`
      .card-actions {
        text-align: right;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-config-name-form": ConfigNameForm;
  }
}
