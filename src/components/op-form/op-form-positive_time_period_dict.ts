import { html, LitElement, TemplateResult } from "lit";
import { customElement, property, query } from "lit/decorators";
import "../op-time-input";
import { HaFormElement, HaFormTimeData, HaFormTimeSchema } from "./op-form";

@customElement("op-form-positive_time_period_dict")
export class HaFormTimePeriod extends LitElement implements HaFormElement {
  @property() public schema!: HaFormTimeSchema;

  @property() public data!: HaFormTimeData;

  @property() public label!: string;

  @property() public suffix!: string;

  @query("op-time-input", true) private _input?: HTMLElement;

  public focus() {
    if (this._input) {
      this._input.focus();
    }
  }

  protected render(): TemplateResult {
    return html`
      <op-time-input
        .label=${this.label}
        .required=${this.schema.required}
        .data=${this.data}
      ></op-time-input>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-form-positive_time_period_dict": HaFormTimePeriod;
  }
}
