import { css, CSSResultGroup, LitElement, svg, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import {
  getValueInPercentage,
  normalize,
  roundWithOneDecimal,
} from "../util/calculate";

@customElement("op-bar")
export class HaBar extends LitElement {
  @property({ type: Number }) public min = 0;

  @property({ type: Number }) public max = 100;

  @property({ type: Number }) public value!: number;

  protected render(): TemplateResult {
    const valuePrecentage = roundWithOneDecimal(
      getValueInPercentage(
        normalize(this.value, this.min, this.max),
        this.min,
        this.max
      )
    );

    return svg`
      <svg>
        <g>
          <rect/>
          <rect width="${valuePrecentage}%"/>
        </g>
      </svg>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      rect {
        height: 100%;
      }
      rect:first-child {
        width: 100%;
        fill: var(--op-bar-background-color, var(--secondary-background-color));
      }
      rect:last-child {
        fill: var(--op-bar-primary-color, var(--primary-color));
        rx: var(--op-bar-border-radius, 4px);
      }
      svg {
        border-radius: var(--op-bar-border-radius, 4px);
        height: 12px;
        width: 100%;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-bar": HaBar;
  }
}
