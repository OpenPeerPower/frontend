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
import { until } from "lit-html/directives/until";
import "../../../src/components/ha-card";
import "../../../src/components/ha-circular-progress";
import { LovelaceCardConfig } from "../../../src/data/lovelace";
import { MockOpenPeerPower } from "../../../src/fake_data/provide_opp";
import { Lovelace, LovelaceCard } from "../../../src/panels/lovelace/types";
import {
  demoConfigs,
  selectedDemoConfig,
  selectedDemoConfigIndex,
  setDemoConfig,
} from "../configs/demo-configs";

export class HADemoCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) public lovelace?: Lovelace;

  @property({ attribute: false }) public opp!: MockOpenPeerPower;

  @state() private _switching = false;

  private _hidden = localStorage.hide_demo_card;

  public getCardSize() {
    return this._hidden ? 0 : 2;
  }

  public setConfig(_config: LovelaceCardConfig) {}

  protected render(): TemplateResult {
    if (this._hidden) {
      return html``;
    }
    return html`
      <ha-card>
        <div class="picker">
          <div class="label">
            ${this._switching
              ? html`<ha-circular-progress active></ha-circular-progress>`
              : until(
                  selectedDemoConfig.then(
                    (conf) => html`
                      ${conf.name}
                      <small>
                        <a target="_blank" href="${conf.authorUrl}">
                          ${this.opp.localize(
                            "ui.panel.page-demo.cards.demo.demo_by",
                            "name",
                            conf.authorName
                          )}
                        </a>
                      </small>
                    `
                  ),
                  ""
                )}
          </div>
          <mwc-button @click=${this._nextConfig} .disabled=${this._switching}>
            ${this.opp.localize("ui.panel.page-demo.cards.demo.next_demo")}
          </mwc-button>
        </div>
        <div class="content small-hidden">
          ${this.opp.localize("ui.panel.page-demo.cards.demo.introduction")}
        </div>
        <div class="actions small-hidden">
          <a href="https://www.openpeerpower.io" target="_blank">
            <mwc-button>
              ${this.opp.localize("ui.panel.page-demo.cards.demo.learn_more")}
            </mwc-button>
          </a>
        </div>
      </ha-card>
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    if (this._hidden) {
      this.style.display = "none";
    }
  }

  private _nextConfig() {
    this._updateConfig(
      selectedDemoConfigIndex < demoConfigs.length - 1
        ? selectedDemoConfigIndex + 1
        : 0
    );
  }

  private async _updateConfig(index: number) {
    this._switching = true;
    try {
      await setDemoConfig(this.opp, this.lovelace!, index);
    } catch (err) {
      alert("Failed to switch config :-(");
    } finally {
      this._switching = false;
    }
  }

  static get styles(): CSSResultGroup {
    return [
      css`
        a {
          color: var(--primary-color);
        }

        .actions a {
          text-decoration: none;
        }

        .content {
          padding: 16px;
        }

        .picker {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 60px;
        }

        .picker mwc-button {
          margin-right: 8px;
        }

        .label {
          padding-left: 16px;
        }

        .label small {
          display: block;
        }

        .actions {
          padding-left: 8px;
        }

        @media only screen and (max-width: 500px) {
          .small-hidden {
            display: none;
          }
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-demo-card": HADemoCard;
  }
}

customElements.define("ha-demo-card", HADemoCard);
