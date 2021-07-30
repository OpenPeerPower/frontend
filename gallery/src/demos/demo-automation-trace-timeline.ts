import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import "../../../src/components/ha-card";
import "../../../src/components/trace/hat-script-graph";
import "../../../src/components/trace/hat-trace-timeline";
import { provideOpp } from "../../../src/fake_data/provide_opp";
import { OpenPeerPower } from "../../../src/types";
import { mockDemoTrace } from "../data/traces/mock-demo-trace";
import { DemoTrace } from "../data/traces/types";

const traces: DemoTrace[] = [
  mockDemoTrace({ state: "running" }),
  mockDemoTrace({ state: "debugged" }),
  mockDemoTrace({ state: "stopped", script_execution: "failed_conditions" }),
  mockDemoTrace({ state: "stopped", script_execution: "failed_single" }),
  mockDemoTrace({ state: "stopped", script_execution: "failed_max_runs" }),
  mockDemoTrace({ state: "stopped", script_execution: "finished" }),
  mockDemoTrace({ state: "stopped", script_execution: "aborted" }),
  mockDemoTrace({
    state: "stopped",
    script_execution: "error",
    error: 'Variable "beer" cannot be None',
  }),
  mockDemoTrace({ state: "stopped", script_execution: "cancelled" }),
];

@customElement("demo-automation-trace-timeline")
export class DemoAutomationTraceTimeline extends LitElement {
  @property({ attribute: false }) opp?: OpenPeerPower;

  protected render(): TemplateResult {
    if (!this.opp) {
      return html``;
    }
    return html`
      ${traces.map(
        (trace) => html`
          <op-card .header=${trace.trace.config.alias}>
            <div class="card-content">
              <hat-trace-timeline
                .opp=${this.opp}
                .trace=${trace.trace}
                .logbookEntries=${trace.logbookEntries}
              ></hat-trace-timeline>
              <button @click=${() => console.log(trace)}>Log trace</button>
            </div>
          </op-card>
        `
      )}
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    const opp = provideOpp(this);
    opp.updateTranslations(null, "en");
  }

  static get styles() {
    return css`
      ha-card {
        max-width: 600px;
        margin: 24px;
      }
      .card-content {
        display: flex;
      }
      button {
        position: absolute;
        top: 0;
        right: 0;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "demo-automation-trace-timeline": DemoAutomationTraceTimeline;
  }
}
