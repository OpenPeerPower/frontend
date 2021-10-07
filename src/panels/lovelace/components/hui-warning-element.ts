import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../../components/op-icon";

@customElement("hui-warning-element")
export class HuiWarningElement extends LitElement {
  @property() public label?: string;

  protected render(): TemplateResult {
    return html` <op-icon icon="opp:alert" .title=${this.label}></op-icon> `;
  }

  static get styles(): CSSResult {
    return css`
      op-icon {
        color: #fce588;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-warning-element": HuiWarningElement;
  }
}
