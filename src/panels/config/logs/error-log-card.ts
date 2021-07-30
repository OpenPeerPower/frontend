import "@material/mwc-button";
import {
  css,
  CSSResult,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../../components/ha-icon-button";
import { fetchErrorLog } from "../../../data/error_log";
import { OpenPeerPower } from "../../../types";

class ErrorLogCard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _errorHTML!: TemplateResult[] | string;

  protected render(): TemplateResult {
    return html`
      <div class="error-log-intro">
        ${this._errorHTML
          ? html`
              <op-card>
                <op-icon-button
                  icon="opp:refresh"
                  @click=${this._refreshErrorLog}
                ></op-icon-button>
                <div class="card-content error-log">${this._errorHTML}</div>
              </op-card>
            `
          : html`
              <mwc-button raised @click=${this._refreshErrorLog}>
                ${this.opp.localize("ui.panel.config.logs.load_full_log")}
              </mwc-button>
            `}
      </div>
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);

    if (this.opp?.config.safe_mode) {
      this._refreshErrorLog();
    }
  }

  static get styles(): CSSResult {
    return css`
      .error-log-intro {
        text-align: center;
        margin: 16px;
      }

      ha-icon-button {
        float: right;
      }

      .error-log {
        @apply --paper-font-code)
          clear: both;
        text-align: left;
        padding-top: 12px;
      }

      .error {
        color: var(--error-color);
      }

      .warning {
        color: var(--warning-color);
      }
    `;
  }

  private async _refreshErrorLog(): Promise<void> {
    this._errorHTML = this.opp.localize("ui.panel.config.logs.loading_log");
    const log = await fetchErrorLog(this.opp!);

    this._errorHTML = log
      ? log.split("\n").map((entry) => {
          if (entry.includes("INFO"))
            return html`<div class="info">${entry}</div>`;

          if (entry.includes("WARNING"))
            return html`<div class="warning">${entry}</div>`;

          if (
            entry.includes("ERROR") ||
            entry.includes("FATAL") ||
            entry.includes("CRITICAL")
          )
            return html`<div class="error">${entry}</div>`;

          return html`<div>${entry}</div>`;
        })
      : this.opp.localize("ui.panel.config.logs.no_errors");
  }
}

customElements.define("error-log-card", ErrorLogCard);
