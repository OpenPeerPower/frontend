import "@material/mwc-button";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import "../../components/op-circular-progress";
import { DataEntryFlowStepProgress } from "../../data/data_entry_flow";
import { OpenPeerPower } from "../../types";
import { FlowConfig } from "./show-dialog-data-entry-flow";
import { configFlowContentStyles } from "./styles";

@customElement("step-flow-progress")
class StepFlowProgress extends LitElement {
  @property({ attribute: false })
  public flowConfig!: FlowConfig;

  @property({ attribute: false })
  public opp!: OpenPeerPower;

  @property({ attribute: false })
  public step!: DataEntryFlowStepProgress;

  protected render(): TemplateResult {
    return html`
      <h2>
        ${this.flowConfig.renderShowFormProgressHeader(this.opp, this.step)}
      </h2>
      <div class="content">
        <op-circular-progress active></op-circular-progress>
        ${this.flowConfig.renderShowFormProgressDescription(
          this.opp,
          this.step
        )}
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return [
      configFlowContentStyles,
      css`
        .content {
          padding: 50px 100px;
          text-align: center;
        }
        op-circular-progress {
          margin-bottom: 16px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "step-flow-progress": StepFlowProgress;
  }
}
