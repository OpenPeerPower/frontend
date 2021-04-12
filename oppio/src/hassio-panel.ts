import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import {
  Supervisor,
  supervisorCollection,
} from "../../src/data/supervisor/supervisor";
import { OpenPeerPower, Route } from "../../src/types";
import "./oppio-panel-router";

@customElement("oppio-panel")
class OppioPanel extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  protected render(): TemplateResult {
    if (!this.opp) {
      return html`<opp-loading-screen></opp-loading-screen>`;
    }

    if (
      Object.keys(supervisorCollection).some(
        (collection) => !this.supervisor[collection]
      )
    ) {
      return html`<opp-loading-screen></opp-loading-screen>`;
    }
    return html`
      <oppio-panel-router
        .opp=${this.opp}
        .supervisor=${this.supervisor}
        .route=${this.route}
        .narrow=${this.narrow}
      ></oppio-panel-router>
    `;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        --app-header-background-color: var(--sidebar-background-color);
        --app-header-text-color: var(--sidebar-text-color);
        --app-header-border-bottom: 1px solid var(--divider-color);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-panel": OppioPanel;
  }
}
