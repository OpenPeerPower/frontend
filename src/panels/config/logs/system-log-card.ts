import "@polymer/paper-item/paper-item";
import "@polymer/paper-item/paper-item-body";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../../components/buttons/ha-call-service-button";
import "../../../components/buttons/ha-progress-button";
import "../../../components/ha-card";
import "../../../components/ha-circular-progress";
import "../../../components/ha-icon-button";
import { domainToName } from "../../../data/integration";
import {
  fetchSystemLog,
  getLoggedErrorIntegration,
  isCustomIntegrationError,
  LoggedError,
} from "../../../data/system_log";
import { OpenPeerPower } from "../../../types";
import { showSystemLogDetailDialog } from "./show-dialog-system-log-detail";
import { formatSystemLogTime } from "./util";

@customElement("system-log-card")
export class SystemLogCard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  public loaded = false;

  @internalProperty() private _items?: LoggedError[];

  public async fetchData(): Promise<void> {
    this._items = undefined;
    this._items = await fetchSystemLog(this.opp!);
  }

  protected render(): TemplateResult {
    const integrations = this._items
      ? this._items.map((item) => getLoggedErrorIntegration(item))
      : [];
    return html`
      <div class="system-log-intro">
        <op-card>
          ${this._items === undefined
            ? html`
                <div class="loading-container">
                  <op-circular-progress active></op-circular-progress>
                </div>
              `
            : html`
                ${this._items.length === 0
                  ? html`
                      <div class="card-content">
                        ${this.opp.localize("ui.panel.config.logs.no_issues")}
                      </div>
                    `
                  : this._items.map(
                      (item, idx) => html`
                        <paper-item @click=${this._openLog} .logItem=${item}>
                          <paper-item-body two-line>
                            <div class="row">${item.message[0]}</div>
                            <div secondary>
                              ${formatSystemLogTime(
                                item.timestamp,
                                this.opp!.locale
                              )}
                              –
                              ${html`(<span class="${item.level.toLowerCase()}"
                                  >${this.opp.localize(
                                    "ui.panel.config.logs.level." +
                                      item.level.toLowerCase()
                                  )}</span
                                >) `}
                              ${integrations[idx]
                                ? `${domainToName(
                                    this.opp!.localize,
                                    integrations[idx]!
                                  )}${
                                    isCustomIntegrationError(item)
                                      ? ` (${this.opp.localize(
                                          "ui.panel.config.logs.custom_integration"
                                        )})`
                                      : ""
                                  }`
                                : item.source[0]}
                              ${item.count > 1
                                ? html`
                                    -
                                    ${this.opp.localize(
                                      "ui.panel.config.logs.multiple_messages",
                                      "time",
                                      formatSystemLogTime(
                                        item.first_occurred,
                                        this.opp!.locale
                                      ),
                                      "counter",
                                      item.count
                                    )}
                                  `
                                : html``}
                            </div>
                          </paper-item-body>
                        </paper-item>
                      `
                    )}

                <div class="card-actions">
                  <op-call-service-button
                    .opp=${this.opp}
                    domain="system_log"
                    service="clear"
                    >${this.opp.localize(
                      "ui.panel.config.logs.clear"
                    )}</op-call-service-button
                  >
                  <op-progress-button @click=${this.fetchData}
                    >${this.opp.localize(
                      "ui.panel.config.logs.refresh"
                    )}</op-progress-button
                  >
                </div>
              `}
        </op-card>
      </div>
    `;
  }

  protected firstUpdated(changedProps): void {
    super.firstUpdated(changedProps);
    this.fetchData();
    this.loaded = true;
    this.addEventListener("opp-service-called", (ev) => this.serviceCalled(ev));
  }

  protected serviceCalled(ev): void {
    // Check if this is for us
    if (ev.detail.success && ev.detail.domain === "system_log") {
      // Do the right thing depending on service
      if (ev.detail.service === "clear") {
        this._items = [];
      }
    }
  }

  private _openLog(ev: Event): void {
    const item = (ev.currentTarget as any).logItem;
    showSystemLogDetailDialog(this, { item });
  }

  static get styles(): CSSResult {
    return css`
      ha-card {
        padding-top: 16px;
      }

      paper-item {
        cursor: pointer;
      }

      .system-log-intro {
        margin: 16px;
      }

      .loading-container {
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .error {
        color: var(--error-color);
      }

      .warning {
        color: var(--warning-color);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "system-log-card": SystemLogCard;
  }
}
