import { css, CSSResultGroup, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import { dynamicElement } from "../../common/dom/dynamic-element-directive";
import { fireEvent } from "../../common/dom/fire_event";
import { HaTimeData } from "../op-time-input";
import "./op-form-boolean";
import "./op-form-constant";
import "./op-form-float";
import "./op-form-integer";
import "./op-form-multi_select";
import "./op-form-positive_time_period_dict";
import "./op-form-select";
import "./op-form-string";

export type HaFormSchema =
  | HaFormConstantSchema
  | HaFormStringSchema
  | HaFormIntegerSchema
  | HaFormFloatSchema
  | HaFormBooleanSchema
  | HaFormSelectSchema
  | HaFormMultiSelectSchema
  | HaFormTimeSchema;

export interface HaFormBaseSchema {
  name: string;
  default?: HaFormData;
  required?: boolean;
  optional?: boolean;
  description?: { suffix?: string; suggested_value?: HaFormData };
}

export interface HaFormConstantSchema extends HaFormBaseSchema {
  type: "constant";
  value: string;
}

export interface HaFormIntegerSchema extends HaFormBaseSchema {
  type: "integer";
  default?: HaFormIntegerData;
  valueMin?: number;
  valueMax?: number;
}

export interface HaFormSelectSchema extends HaFormBaseSchema {
  type: "select";
  options?: string[] | Array<[string, string]>;
}

export interface HaFormMultiSelectSchema extends HaFormBaseSchema {
  type: "multi_select";
  options?: Record<string, string> | string[] | Array<[string, string]>;
}

export interface HaFormFloatSchema extends HaFormBaseSchema {
  type: "float";
}

export interface HaFormStringSchema extends HaFormBaseSchema {
  type: "string";
  format?: string;
}

export interface HaFormBooleanSchema extends HaFormBaseSchema {
  type: "boolean";
}

export interface HaFormTimeSchema extends HaFormBaseSchema {
  type: "positive_time_period_dict";
}

export interface HaFormDataContainer {
  [key: string]: HaFormData;
}

export type HaFormData =
  | HaFormStringData
  | HaFormIntegerData
  | HaFormFloatData
  | HaFormBooleanData
  | HaFormSelectData
  | HaFormMultiSelectData
  | HaFormTimeData;

export type HaFormStringData = string;
export type HaFormIntegerData = number;
export type HaFormFloatData = number;
export type HaFormBooleanData = boolean;
export type HaFormSelectData = string;
export type HaFormMultiSelectData = string[];
export type HaFormTimeData = HaTimeData;

export interface HaFormElement extends LitElement {
  schema: HaFormSchema | HaFormSchema[];
  data?: HaFormDataContainer | HaFormData;
  label?: string;
  suffix?: string;
}

@customElement("op-form")
export class HaForm extends LitElement implements HaFormElement {
  @property() public data!: HaFormDataContainer | HaFormData;

  @property() public schema!: HaFormSchema | HaFormSchema[];

  @property() public error;

  @property() public computeError?: (schema: HaFormSchema, error) => string;

  @property() public computeLabel?: (schema: HaFormSchema) => string;

  @property() public computeSuffix?: (schema: HaFormSchema) => string;

  public focus() {
    const input =
      this.shadowRoot!.getElementById("child-form") ||
      this.shadowRoot!.querySelector("op-form");
    if (!input) {
      return;
    }
    (input as HTMLElement).focus();
  }

  protected render() {
    if (Array.isArray(this.schema)) {
      return html`
        ${this.error && this.error.base
          ? html`
              <div class="error">
                ${this._computeError(this.error.base, this.schema)}
              </div>
            `
          : ""}
        ${this.schema.map(
          (item) => html`
            <op-form
              .data=${this._getValue(this.data, item)}
              .schema=${item}
              .error=${this._getValue(this.error, item)}
              @value-changed=${this._valueChanged}
              .computeError=${this.computeError}
              .computeLabel=${this.computeLabel}
              .computeSuffix=${this.computeSuffix}
            ></op-form>
          `
        )}
      `;
    }

    return html`
      ${this.error
        ? html`
            <div class="error">
              ${this._computeError(this.error, this.schema)}
            </div>
          `
        : ""}
      ${dynamicElement(`op-form-${this.schema.type}`, {
        schema: this.schema,
        data: this.data,
        label: this._computeLabel(this.schema),
        suffix: this._computeSuffix(this.schema),
        id: "child-form",
      })}
    `;
  }

  private _computeLabel(schema: HaFormSchema) {
    return this.computeLabel
      ? this.computeLabel(schema)
      : schema
      ? schema.name
      : "";
  }

  private _computeSuffix(schema: HaFormSchema) {
    return this.computeSuffix
      ? this.computeSuffix(schema)
      : schema && schema.description
      ? schema.description.suffix
      : "";
  }

  private _computeError(error, schema: HaFormSchema | HaFormSchema[]) {
    return this.computeError ? this.computeError(error, schema) : error;
  }

  private _getValue(obj, item) {
    if (obj) {
      return obj[item.name];
    }
    return null;
  }

  private _valueChanged(ev: CustomEvent) {
    ev.stopPropagation();
    const schema = (ev.target as HaFormElement).schema as HaFormSchema;
    const data = this.data as HaFormDataContainer;
    fireEvent(this, "value-changed", {
      value: { ...data, [schema.name]: ev.detail.value },
    });
  }

  static get styles(): CSSResultGroup {
    return css`
      .error {
        color: var(--error-color);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-form": HaForm;
  }
}
