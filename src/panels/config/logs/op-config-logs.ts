import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  query,
  TemplateResult,
} from "lit-element";
import "../../../layouts/opp-tabs-subpage";
import { haStyle } from "../../../resources/styles";
import { OpenPeerPower, Route } from "../../../types";
import { configSections } from "../op-panel-config";
import "./error-log-card";
import "./system-log-card";
import type { SystemLogCard } from "./system-log-card";

@customElement("op-config-logs")
export class HaConfigLogs extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  @property() public isWide!: boolean;

  @property() public showAdvanced!: boolean;

  @property() public route!: Route;

  @query("system-log-card", true) private systemLog?: SystemLogCard;

  public connectedCallback() {
    super.connectedCallback();
    if (this.systemLog && this.systemLog.loaded) {
      this.systemLog.fetchData();
    }
  }

  protected render(): TemplateResult {
    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        back-path="/config"
        .route=${this.route}
        .tabs=${configSections.general}
      >
        <div class="content">
          <system-log-card .opp=${this.opp}></system-log-card>
          <error-log-card .opp=${this.opp}></error-log-card>
        </div>
      </opp-tabs-subpage>
    `;
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        :host {
          -ms-user-select: initial;
          -webkit-user-select: initial;
          -moz-user-select: initial;
        }

        .content {
          direction: ltr;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-config-logs": HaConfigLogs;
  }
}
