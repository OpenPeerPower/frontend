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
import { DurationDict, Timer } from "../../../../data/timer";
import { haStyle } from "../../../../resources/styles";
import { OpenPeerPower } from "../../../../types";

@customElement("ha-timer-form")
class HaTimerForm extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public new?: boolean;

  private _item?: Timer;

  @internalProperty() private _name!: string;

  @internalProperty() private _icon!: string;

  @internalProperty() private _duration!: string | number | DurationDict;

  set item(item: Timer) {
    this._item = item;
    if (item) {
      this._name = item.name || "";
      this._icon = item.icon || "";
      this._duration = item.duration || "";
    } else {
      this._name = "";
      this._icon = "";
      this._duration = "00:00:00";
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
        <paper-input
          .configValue=${"duration"}
          .value=${this._duration}
          @value-changed=${this._valueChanged}
          .label=${this.opp.localize(
            "ui.dialogs.helper_settings.timer.duration"
          )}
        ></paper-input>
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
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-timer-form": HaTimerForm;
  }
}
