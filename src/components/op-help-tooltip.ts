import { mdiHelpCircle } from "@mdi/js";
import "@polymer/paper-tooltip/paper-tooltip";
import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import "./op-svg-icon";

@customElement("op-help-tooltip")
export class HaHelpTooltip extends LitElement {
  @property() public label!: string;

  @property() public position = "top";

  protected render(): TemplateResult {
    return html`
      <op-svg-icon .path=${mdiHelpCircle}></op-svg-icon>
      <paper-tooltip
        offset="4"
        .position=${this.position}
        .fitToVisibleBounds=${true}
        >${this.label}</paper-tooltip
      >
    `;
  }

  static get styles() {
    return css`
      op-svg-icon {
        --mdc-icon-size: var(--op-help-tooltip-size, 14px);
        color: var(--op-help-tooltip-color, var(--disabled-text-color));
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-help-tooltip": HaHelpTooltip;
  }
}
