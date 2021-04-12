import { safeDump } from "js-yaml";
import {
  customElement,
  html,
  css,
  LitElement,
  TemplateResult,
  property,
} from "lit-element";
import "../../../src/components/ha-card";
import { describeAction } from "../../../src/data/script_i18n";
import { provideOpp } from "../../../src/fake_data/provide_opp";
import { OpenPeerPower } from "../../../src/types";

const actions = [
  { wait_template: "{{ true }}", alias: "Something with an alias" },
  { delay: "0:05" },
  { wait_template: "{{ true }}" },
  {
    condition: "template",
    value_template: "{{ true }}",
  },
  { event: "happy_event" },
  {
    device_id: "abcdefgh",
    domain: "plex",
    entity_id: "media_player.kitchen",
  },
  { scene: "scene.kitchen_morning" },
  {
    wait_for_trigger: [
      {
        platform: "state",
        entity_id: "input_boolean.toggle_1",
      },
    ],
  },
  {
    variables: {
      hello: "world",
    },
  },
  {
    service: "input_boolean.toggle",
    target: {
      entity_id: "input_boolean.toggle_4",
    },
  },
];

@customElement("demo-automation-describe-action")
export class DemoAutomationDescribeAction extends LitElement {
  @property({ attribute: false }) opp!: OpenPeerPower;

  protected render(): TemplateResult {
    if (!this.opp) {
      return html``;
    }
    return html`
      <ha-card header="Actions">
        ${actions.map(
          (conf) => html`
            <div class="action">
              <span>${describeAction(this.opp, conf as any)}</span>
              <pre>${safeDump(conf)}</pre>
            </div>
          `
        )}
      </ha-card>
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
        margin: 24px auto;
      }
      .action {
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
    "demo-automation-describe-action": DemoAutomationDescribeAction;
  }
}
