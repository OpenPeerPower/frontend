import { PaperInputElement } from "@polymer/paper-input/paper-input";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../../../../src/common/dom/fire_event";
import "../../../../src/components/buttons/op-progress-button";
import "../../../../src/components/op-card";
import {
  OppioAddonDetails,
  OppioAddonSetOptionParams,
  setOppioAddonOption,
} from "../../../../src/data/oppio/addon";
import { extractApiErrorMessage } from "../../../../src/data/oppio/common";
import { Supervisor } from "../../../../src/data/supervisor/supervisor";
import { haStyle } from "../../../../src/resources/styles";
import { OpenPeerPower } from "../../../../src/types";
import { suggestAddonRestart } from "../../dialogs/suggestAddonRestart";
import { oppioStyle } from "../../resources/oppio-style";

interface NetworkItem {
  description: string;
  container: string;
  host: number | null;
}

interface NetworkItemInput extends PaperInputElement {
  container: string;
}

@customElement("oppio-addon-network")
class OppioAddonNetwork extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ attribute: false }) public addon!: OppioAddonDetails;

  @state() private _error?: string;

  @state() private _config?: NetworkItem[];

  public connectedCallback(): void {
    super.connectedCallback();
    this._setNetworkConfig();
  }

  protected render(): TemplateResult {
    if (!this._config) {
      return html``;
    }

    return html`
      <op-card
        .header=${this.supervisor.localize(
          "addon.configuration.network.header"
        )}
      >
        <div class="card-content">
          ${this._error ? html` <div class="errors">${this._error}</div> ` : ""}

          <table>
            <tbody>
              <tr>
                <th>
                  ${this.supervisor.localize(
                    "addon.configuration.network.container"
                  )}
                </th>
                <th>
                  ${this.supervisor.localize(
                    "addon.configuration.network.host"
                  )}
                </th>
                <th>${this.supervisor.localize("common.description")}</th>
              </tr>
              ${this._config!.map(
                (item) => html`
                  <tr>
                    <td>${item.container}</td>
                    <td>
                      <paper-input
                        @value-changed=${this._configChanged}
                        placeholder="${this.supervisor.localize(
                          "addon.configuration.network.disabled"
                        )}"
                        .value=${item.host ? String(item.host) : ""}
                        .container=${item.container}
                        no-label-float
                      ></paper-input>
                    </td>
                    <td>${this._computeDescription(item)}</td>
                  </tr>
                `
              )}
            </tbody>
          </table>
        </div>
        <div class="card-actions">
          <op-progress-button class="warning" @click=${this._resetTapped}>
            ${this.supervisor.localize("common.reset_defaults")}
          </op-progress-button>
          <op-progress-button @click=${this._saveTapped}>
            ${this.supervisor.localize("common.save")}
          </op-progress-button>
        </div>
      </op-card>
    `;
  }

  protected update(changedProperties: PropertyValues): void {
    super.update(changedProperties);
    if (changedProperties.has("addon")) {
      this._setNetworkConfig();
    }
  }

  private _computeDescription = (item: NetworkItem): string =>
    this.addon.translations[this.opp.language]?.network?.[item.container]
      ?.description ||
    this.addon.translations.en?.network?.[item.container]?.description ||
    item.description;

  private _setNetworkConfig(): void {
    const network = this.addon.network || {};
    const description = this.addon.network_description || {};
    const items: NetworkItem[] = Object.keys(network).map((key) => ({
      container: key,
      host: network[key],
      description: description[key],
    }));
    this._config = items.sort((a, b) => (a.container > b.container ? 1 : -1));
  }

  private async _configChanged(ev: Event): Promise<void> {
    const target = ev.target as NetworkItemInput;
    this._config!.forEach((item) => {
      if (
        item.container === target.container &&
        item.host !== parseInt(String(target.value), 10)
      ) {
        item.host = target.value ? parseInt(String(target.value), 10) : null;
      }
    });
  }

  private async _resetTapped(ev: CustomEvent): Promise<void> {
    const button = ev.currentTarget as any;
    button.progress = true;

    const data: OppioAddonSetOptionParams = {
      network: null,
    };

    try {
      await setOppioAddonOption(this.opp, this.addon.slug, data);
      const eventdata = {
        success: true,
        response: undefined,
        path: "option",
      };
      fireEvent(this, "opp-api-called", eventdata);
      if (this.addon?.state === "started") {
        await suggestAddonRestart(this, this.opp, this.supervisor, this.addon);
      }
    } catch (err) {
      this._error = this.supervisor.localize(
        "addon.failed_to_reset",
        "error",
        extractApiErrorMessage(err)
      );
    }

    button.progress = false;
  }

  private async _saveTapped(ev: CustomEvent): Promise<void> {
    const button = ev.currentTarget as any;
    button.progress = true;

    this._error = undefined;
    const networkconfiguration = {};
    this._config!.forEach((item) => {
      networkconfiguration[item.container] = parseInt(String(item.host), 10);
    });

    const data: OppioAddonSetOptionParams = {
      network: networkconfiguration,
    };

    try {
      await setOppioAddonOption(this.opp, this.addon.slug, data);
      const eventdata = {
        success: true,
        response: undefined,
        path: "option",
      };
      fireEvent(this, "opp-api-called", eventdata);
      if (this.addon?.state === "started") {
        await suggestAddonRestart(this, this.opp, this.supervisor, this.addon);
      }
    } catch (err) {
      this._error = this.supervisor.localize(
        "addon.failed_to_save",
        "error",
        extractApiErrorMessage(err)
      );
    }
    button.progress = false;
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      oppioStyle,
      css`
        :host {
          display: block;
        }
        op-card {
          display: block;
        }
        .errors {
          color: var(--error-color);
          margin-bottom: 16px;
        }
        .card-actions {
          display: flex;
          justify-content: space-between;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-addon-network": OppioAddonNetwork;
  }
}
