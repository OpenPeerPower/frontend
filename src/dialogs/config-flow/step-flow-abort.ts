import "@material/mwc-button";
import {
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../common/dom/fire_event";
import { DataEntryFlowStepAbort } from "../../data/data_entry_flow";
import { OpenPeerPower } from "../../types";
import { FlowConfig } from "./show-dialog-data-entry-flow";
import { configFlowContentStyles } from "./styles";

@customElement("step-flow-abort")
class StepFlowAbort extends LitElement {
  public flowConfig!: FlowConfig;

  @property()
  public opp!: OpenPeerPower;

  @property()
  private step!: DataEntryFlowStepAbort;

  protected render(): TemplateResult {
    return html`
      <h2>
        ${this.opp.localize(
          "ui.panel.config.integrations.config_flow.aborted"
        )}
      </h2>
      <div class="content">
        ${this.flowConfig.renderAbortDescription(this.opp, this.step)}
      </div>
      <div class="buttons">
        <mwc-button @click="${this._flowDone}"
          >${this.opp.localize(
            "ui.panel.config.integrations.config_flow.close"
          )}</mwc-button
        >
      </div>
    `;
  }

  private _flowDone(): void {
    fireEvent(this, "flow-update", { step: undefined });
  }

  static get styles(): CSSResult {
    return configFlowContentStyles;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "step-flow-abort": StepFlowAbort;
  }
}
