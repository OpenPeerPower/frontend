import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { Supervisor } from "../../../src/data/supervisor/supervisor";
import "../../../src/layouts/opp-tabs-subpage";
import { haStyle } from "../../../src/resources/styles";
import { OpenPeerPower, Route } from "../../../src/types";
import { supervisorTabs } from "../oppio-tabs";
import { oppioStyle } from "../resources/oppio-style";
import "./oppio-core-info";
import "./oppio-host-info";
import "./oppio-supervisor-info";
import "./oppio-supervisor-log";

@customElement("oppio-system")
class OppioSystem extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  protected render(): TemplateResult | void {
    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .localizeFunc=${this.supervisor.localize}
        .narrow=${this.narrow}
        .route=${this.route}
        .tabs=${supervisorTabs}
        main-page
        supervisor
      >
        <span slot="header">
          ${this.supervisor.localize("panel.system")}
        </span>
        <div class="content">
          <div class="card-group">
            <oppio-core-info
              .opp=${this.opp}
              .supervisor=${this.supervisor}
            ></oppio-core-info>
            <oppio-supervisor-info
              .opp=${this.opp}
              .supervisor=${this.supervisor}
            ></oppio-supervisor-info>
            <oppio-host-info
              .opp=${this.opp}
              .supervisor=${this.supervisor}
            ></oppio-host-info>
          </div>
          <oppio-supervisor-log
            .opp=${this.opp}
            .supervisor=${this.supervisor}
          ></oppio-supervisor-log>
        </div>
      </opp-tabs-subpage>
    `;
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      oppioStyle,
      css`
        .content {
          margin: 8px;
          color: var(--primary-text-color);
        }
        .title {
          margin-top: 24px;
          color: var(--primary-text-color);
          font-size: 2em;
          padding-left: 8px;
          margin-bottom: 8px;
        }
        oppio-supervisor-log {
          width: 100%;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-system": OppioSystem;
  }
}
