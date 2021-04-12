import {
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  query,
  TemplateResult,
} from "lit-element";
import { isComponentLoaded } from "../common/config/is_component_loaded";
import { fireEvent } from "../common/dom/fire_event";
import { compare } from "../common/string/compare";
import { OppioAddonInfo } from "../data/oppio/addon";
import { fetchOppioSupervisorInfo } from "../data/oppio/supervisor";
import { showAlertDialog } from "../dialogs/generic/show-dialog-box";
import { PolymerChangedEvent } from "../polymer-types";
import { OpenPeerPower } from "../types";
import { HaComboBox } from "./ha-combo-box";

const rowRenderer = (
  root: HTMLElement,
  _owner,
  model: { item: OppioAddonInfo }
) => {
  if (!root.firstElementChild) {
    root.innerHTML = `
    <style>
      paper-item {
        margin: -10px 0;
        padding: 0;
      }
    </style>
    <paper-item>
      <paper-item-body two-line="">
        <div class='name'>[[item.name]]</div>
        <div secondary>[[item.slug]]</div>
      </paper-item-body>
    </paper-item>
    `;
  }

  root.querySelector(".name")!.textContent = model.item.name;
  root.querySelector("[secondary]")!.textContent = model.item.slug;
};

@customElement("ha-addon-picker")
class HaAddonPicker extends LitElement {
  public opp!: OpenPeerPower;

  @property() public label?: string;

  @property() public value = "";

  @internalProperty() private _addons?: OppioAddonInfo[];

  @property({ type: Boolean }) public disabled = false;

  @query("ha-combo-box") private _comboBox!: HaComboBox;

  public open() {
    this._comboBox?.open();
  }

  public focus() {
    this._comboBox?.focus();
  }

  protected firstUpdated() {
    this._getAddons();
  }

  protected render(): TemplateResult {
    if (!this._addons) {
      return html``;
    }
    return html`
      <ha-combo-box
        .opp=${this.opp}
        .label=${this.label === undefined && this.opp
          ? this.opp.localize("ui.components.addon-picker.addon")
          : this.label}
        .value=${this._value}
        .renderer=${rowRenderer}
        .items=${this._addons}
        item-value-path="slug"
        item-id-path="slug"
        item-label-path="name"
        @value-changed=${this._addonChanged}
      ></ha-combo-box>
    `;
  }

  private async _getAddons() {
    try {
      if (isComponentLoaded(this.opp, "oppio")) {
        const supervisorInfo = await fetchOppioSupervisorInfo(this.opp);
        this._addons = supervisorInfo.addons.sort((a, b) =>
          compare(a.name, b.name)
        );
      } else {
        showAlertDialog(this, {
          title: this.opp.localize(
            "ui.componencts.addon-picker.error.no_supervisor.title"
          ),
          text: this.opp.localize(
            "ui.componencts.addon-picker.error.no_supervisor.description"
          ),
        });
      }
    } catch (error) {
      showAlertDialog(this, {
        title: this.opp.localize(
          "ui.componencts.addon-picker.error.fetch_addons.title"
        ),
        text: this.opp.localize(
          "ui.componencts.addon-picker.error.fetch_addons.description"
        ),
      });
    }
  }

  private get _value() {
    return this.value || "";
  }

  private _addonChanged(ev: PolymerChangedEvent<string>) {
    ev.stopPropagation();
    const newValue = ev.detail.value;

    if (newValue !== this._value) {
      this._setValue(newValue);
    }
  }

  private _setValue(value: string) {
    this.value = value;
    setTimeout(() => {
      fireEvent(this, "value-changed", { value });
      fireEvent(this, "change");
    }, 0);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-addon-picker": HaAddonPicker;
  }
}
