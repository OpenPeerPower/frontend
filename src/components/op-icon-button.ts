import "@material/mwc-icon-button";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import "./op-icon";

@customElement("op-icon-button")
export class HaIconButton extends LitElement {
  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ type: String }) icon = "";

  @property({ type: String }) label = "";

  static shadowRootOptions: ShadowRootInit = {
    mode: "open",
    delegatesFocus: true,
  };

  protected render(): TemplateResult {
    return html`
      <mwc-icon-button .label=${this.label} .disabled=${this.disabled}>
        <op-icon .icon=${this.icon}></op-icon>
      </mwc-icon-button>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: inline-block;
        outline: none;
      }
      :host([disabled]) {
        pointer-events: none;
      }
      mwc-icon-button {
        --mdc-theme-on-primary: currentColor;
        --mdc-theme-text-disabled-on-light: var(--disabled-text-color);
      }
      op-icon {
        --op-icon-display: inline;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-icon-button": HaIconButton;
  }
}
