import "@material/mwc-button";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import "../../../src/components/buttons/op-progress-button";
import "../../../src/components/op-card";
import { extractApiErrorMessage } from "../../../src/data/oppio/common";
import { fetchOppioLogs } from "../../../src/data/oppio/supervisor";
import { Supervisor } from "../../../src/data/supervisor/supervisor";
import "../../../src/layouts/opp-loading-screen";
import { haStyle } from "../../../src/resources/styles";
import { OpenPeerPower } from "../../../src/types";
import "../components/oppio-ansi-to-html";
import { oppioStyle } from "../resources/oppio-style";

interface LogProvider {
  key: string;
  name: string;
}

const logProviders: LogProvider[] = [
  {
    key: "supervisor",
    name: "Supervisor",
  },
  {
    key: "core",
    name: "Core",
  },
  {
    key: "host",
    name: "Host",
  },
  {
    key: "dns",
    name: "DNS",
  },
  {
    key: "audio",
    name: "Audio",
  },
  {
    key: "multicast",
    name: "Multicast",
  },
];

@customElement("oppio-supervisor-log")
class OppioSupervisorLog extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @state() private _error?: string;

  @state() private _selectedLogProvider = "supervisor";

  @state() private _content?: string;

  public async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this._loadData();
  }

  protected render(): TemplateResult | void {
    return html`
      <op-card>
        ${this._error ? html` <div class="errors">${this._error}</div> ` : ""}
        ${this.opp.userData?.showAdvanced
          ? html`
              <paper-dropdown-menu
                .label=${this.supervisor.localize("system.log.log_provider")}
                @iron-select=${this._setLogProvider}
              >
                <paper-listbox
                  slot="dropdown-content"
                  attr-for-selected="provider"
                  .selected=${this._selectedLogProvider}
                >
                  ${logProviders.map(
                    (provider) => html`
                      <paper-item provider=${provider.key}>
                        ${provider.name}
                      </paper-item>
                    `
                  )}
                </paper-listbox>
              </paper-dropdown-menu>
            `
          : ""}

        <div class="card-content" id="content">
          ${this._content
            ? html`<oppio-ansi-to-html .content=${this._content}>
              </oppio-ansi-to-html>`
            : html`<opp-loading-screen no-toolbar></opp-loading-screen>`}
        </div>
        <div class="card-actions">
          <op-progress-button @click=${this._refresh}>
            ${this.supervisor.localize("common.refresh")}
          </op-progress-button>
        </div>
      </op-card>
    `;
  }

  private async _setLogProvider(ev): Promise<void> {
    const provider = ev.detail.item.getAttribute("provider");
    this._selectedLogProvider = provider;
    this._loadData();
  }

  private async _refresh(ev: CustomEvent): Promise<void> {
    const button = ev.currentTarget as any;
    button.progress = true;
    await this._loadData();
    button.progress = false;
  }

  private async _loadData(): Promise<void> {
    this._error = undefined;

    try {
      this._content = await fetchOppioLogs(
        this.opp,
        this._selectedLogProvider
      );
    } catch (err) {
      this._error = this.supervisor.localize(
        "system.log.get_logs",
        "provider",
        this._selectedLogProvider,
        "error",
        extractApiErrorMessage(err)
      );
    }
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      oppioStyle,
      css`
        op-card {
          margin-top: 8px;
          width: 100%;
        }
        pre {
          white-space: pre-wrap;
        }
        paper-dropdown-menu {
          padding: 0 2%;
          width: 96%;
        }
        .errors {
          color: var(--error-color);
          margin-bottom: 16px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-supervisor-log": OppioSupervisorLog;
  }
}
