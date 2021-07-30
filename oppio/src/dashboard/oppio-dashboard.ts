import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import { Supervisor } from "../../../src/data/supervisor/supervisor";
import "../../../src/layouts/opp-tabs-subpage";
import { haStyle } from "../../../src/resources/styles";
import { OpenPeerPower, Route } from "../../../src/types";
import { supervisorTabs } from "../oppio-tabs";
import "./oppio-addons";
import "./oppio-update";

@customElement("oppio-dashboard")
class OppioDashboard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  protected render(): TemplateResult {
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
          ${this.supervisor.localize("panel.dashboard")}
        </span>
        <div class="content">
          <oppio-update
            .opp=${this.opp}
            .supervisor=${this.supervisor}
          ></oppio-update>
          <oppio-addons
            .opp=${this.opp}
            .supervisor=${this.supervisor}
          ></oppio-addons>
        </div>
      </opp-tabs-subpage>
    `;
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      css`
        .content {
          margin: 0 auto;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-dashboard": OppioDashboard;
  }
}
