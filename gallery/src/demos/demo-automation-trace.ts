import { html, css, LitElement, TemplateResult } from "lit";
import "../../../src/components/ha-card";
import "../../../src/components/trace/hat-script-graph";
import "../../../src/components/trace/hat-trace-timeline";
import { customElement, property, state } from "lit/decorators";
import { provideOpp } from "../../../src/fake_data/provide_opp";
import { OpenPeerPower } from "../../../src/types";
import { DemoTrace } from "../data/traces/types";
import { basicTrace } from "../data/traces/basic_trace";
import { motionLightTrace } from "../data/traces/motion-light-trace";

const traces: DemoTrace[] = [basicTrace, motionLightTrace];

@customElement("demo-automation-trace")
export class DemoAutomationTrace extends LitElement {
  @property({ attribute: false }) opp?: OpenPeerPower;

  @state() private _selected = {};

  protected render(): TemplateResult {
    if (!this.opp) {
      return html``;
    }
    return html`
      ${traces.map(
        (trace, idx) => html`
          <op-card .header=${trace.trace.config.alias}>
            <div class="card-content">
              <hat-script-graph
                .trace=${trace.trace}
                .selected=${this._selected[idx]}
                @graph-node-selected=${(ev) => {
                  this._selected = { ...this._selected, [idx]: ev.detail.path };
                }}
              ></hat-script-graph>
              <hat-trace-timeline
                allowPick
                .opp=${this.opp}
                .trace=${trace.trace}
                .logbookEntries=${trace.logbookEntries}
                .selectedPath=${this._selected[idx]}
                @value-changed=${(ev) => {
                  this._selected = {
                    ...this._selected,
                    [idx]: ev.detail.value,
                  };
                }}
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
      .card-content > * {
        margin-right: 16px;
      }
      .card-content > *:last-child {
        margin-right: 0;
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
    "demo-automation-trace": DemoAutomationTrace;
  }
}
