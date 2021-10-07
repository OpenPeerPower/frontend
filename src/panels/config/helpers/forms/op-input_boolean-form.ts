import "@polymer/paper-input/paper-input";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../../../common/dom/fire_event";
import "../../../../components/op-icon-input";
import { InputBoolean } from "../../../../data/input_boolean";
import { haStyle } from "../../../../resources/styles";
import { OpenPeerPower } from "../../../../types";

@customElement("ha-input_boolean-form")
class HaInputBooleanForm extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public new?: boolean;

  private _item?: InputBoolean;

  @internalProperty() private _name!: string;

  @internalProperty() private _icon!: string;

  set item(item: InputBoolean) {
    this._item = item;
    if (item) {
      this._name = item.name || "";
      this._icon = item.icon || "";
    } else {
      this._name = "";
      this._icon = "";
    }
  }

  public focus() {
    this.updateComplete.then(() =>
      (
        this.shadowRoot?.querySelector("[dialogInitialFocus]") as HTMLElement
      )?.focus()
    );
  }

  protected render(): TemplateResult {
    if (!this.opp) {
      return html``;
    }
    const nameInvalid = !this._name || this._name.trim() === "";

    return html`
      <div class="form">
        <paper-input
          .value=${this._name}
          .configValue=${"name"}
          @value-changed=${this._valueChanged}
          .label=${this.opp!.localize(
            "ui.dialogs.helper_settings.generic.name"
          )}
          .errorMessage="${this.opp!.localize(
            "ui.dialogs.helper_settings.required_error_msg"
          )}"
          .invalid=${nameInvalid}
          dialogInitialFocus
        ></paper-input>
        <op-icon-input
          .value=${this._icon}
          .configValue=${"icon"}
          @value-changed=${this._valueChanged}
          .label=${this.opp!.localize(
            "ui.dialogs.helper_settings.generic.icon"
          )}
        ></op-icon-input>
      </div>
    `;
  }

  private _valueChanged(ev: CustomEvent) {
    if (!this.new && !this._item) {
      return;
    }
    ev.stopPropagation();
    const configValue = (ev.target as any).configValue;
    const value = ev.detail.value;
    if (this[`_${configValue}`] === value) {
      return;
    }
    const newValue = { ...this._item };
    if (!value) {
      delete newValue[configValue];
    } else {
      newValue[configValue] = ev.detail.value;
    }
    fireEvent(this, "value-changed", {
      value: newValue,
    });
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        .form {
          color: var(--primary-text-color);
        }
        .row {
          padding: 16px 0;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-input_boolean-form": HaInputBooleanForm;
  }
}
