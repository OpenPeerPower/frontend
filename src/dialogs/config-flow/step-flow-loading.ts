import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import "../../components/op-circular-progress";
import { DataEntryFlowStep } from "../../data/data_entry_flow";
import { OpenPeerPower } from "../../types";
import { FlowConfig, LoadingReason } from "./show-dialog-data-entry-flow";

@customElement("step-flow-loading")
class StepFlowLoading extends LitElement {
  @property({ attribute: false }) public flowConfig!: FlowConfig;

  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public loadingReason!: LoadingReason;

  @property() public handler?: string;

  @property({ attribute: false }) public step?: DataEntryFlowStep | null;

  protected render(): TemplateResult {
    const description = this.flowConfig.renderLoadingDescription(
      this.opp,
      this.loadingReason,
      this.handler,
      this.step
    );
    return html`
      <div class="init-spinner">
        ${description ? html`<div>${description}</div>` : ""}
        <op-circular-progress active></op-circular-progress>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      .init-spinner {
        padding: 50px 100px;
        text-align: center;
      }
      op-circular-progress {
        margin-top: 16px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "step-flow-loading": StepFlowLoading;
  }
}
