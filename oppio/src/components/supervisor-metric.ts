import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import "../../../src/components/op-bar";
import "../../../src/components/op-settings-row";
import { roundWithOneDecimal } from "../../../src/util/calculate";

@customElement("supervisor-metric")
class SupervisorMetric extends LitElement {
  @property({ type: Number }) public value!: number;

  @property({ type: String }) public description!: string;

  @property({ type: String }) public tooltip?: string;

  protected render(): TemplateResult {
    const roundedValue = roundWithOneDecimal(this.value);
    return html`<op-settings-row>
      <span slot="heading"> ${this.description} </span>
      <div slot="description" .title=${this.tooltip ?? ""}>
        <span class="value"> ${roundedValue} % </span>
        <op-bar
          class="${classMap({
            "target-warning": roundedValue > 50,
            "target-critical": roundedValue > 85,
          })}"
          .value=${this.value}
        ></op-bar>
      </div>
    </op-settings-row>`;
  }

  static get styles(): CSSResultGroup {
    return css`
      op-settings-row {
        padding: 0;
        height: 54px;
        width: 100%;
      }
      op-settings-row > div[slot="description"] {
        white-space: normal;
        color: var(--secondary-text-color);
        display: flex;
        justify-content: space-between;
      }
      op-bar {
        --op-bar-primary-color: var(
          --oppio-bar-ok-color,
          var(--success-color)
        );
      }
      .target-warning {
        --op-bar-primary-color: var(
          --oppio-bar-warning-color,
          var(--warning-color)
        );
      }
      .target-critical {
        --op-bar-primary-color: var(
          --oppio-bar-critical-color,
          var(--error-color)
        );
      }
      .value {
        width: 48px;
        padding-right: 4px;
        flex-shrink: 0;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "supervisor-metric": SupervisorMetric;
  }
}
