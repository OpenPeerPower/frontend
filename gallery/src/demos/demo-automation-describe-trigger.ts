import { dump } from "js-yaml";
import { html, css, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators";
import "../../../src/components/op-card";
import { describeTrigger } from "../../../src/data/automation_i18n";

const triggers = [
  { platform: "state" },
  { platform: "mqtt" },
  { platform: "geo_location" },
  { platform: "openpeerpower" },
  { platform: "numeric_state" },
  { platform: "sun" },
  { platform: "time_pattern" },
  { platform: "webhook" },
  { platform: "zone" },
  { platform: "tag" },
  { platform: "time" },
  { platform: "template" },
  { platform: "event" },
];

@customElement("demo-automation-describe-trigger")
export class DemoAutomationDescribeTrigger extends LitElement {
  protected render(): TemplateResult {
    return html`
      <op-card header="Triggers">
        ${triggers.map(
          (conf) => html`
            <div class="trigger">
              <span>${describeTrigger(conf as any)}</span>
              <pre>${dump(conf)}</pre>
            </div>
          `
        )}
      </op-card>
    `;
  }

  static get styles() {
    return css`
      op-card {
        max-width: 600px;
        margin: 24px auto;
      }
      .trigger {
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      span {
        margin-right: 16px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "demo-automation-describe-trigger": DemoAutomationDescribeTrigger;
  }
}
