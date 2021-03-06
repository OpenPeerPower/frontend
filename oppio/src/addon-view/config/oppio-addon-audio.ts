import "@material/mwc-button";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import "web-animations-js/web-animations-next-lite.min";
import "../../../../src/components/buttons/ha-progress-button";
import "../../../../src/components/ha-card";
import {
  OppioAddonDetails,
  OppioAddonSetOptionParams,
  setOppioAddonOption,
} from "../../../../src/data/oppio/addon";
import {
  fetchOppioHardwareAudio,
  OppioHardwareAudioDevice,
} from "../../../../src/data/oppio/hardware";
import { Supervisor } from "../../../../src/data/supervisor/supervisor";
import { haStyle } from "../../../../src/resources/styles";
import { OpenPeerPower } from "../../../../src/types";
import { suggestAddonRestart } from "../../dialogs/suggestAddonRestart";
import { oppioStyle } from "../../resources/oppio-style";

@customElement("oppio-addon-audio")
class OppioAddonAudio extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ attribute: false }) public addon!: OppioAddonDetails;

  @internalProperty() private _error?: string;

  @internalProperty() private _inputDevices?: OppioHardwareAudioDevice[];

  @internalProperty() private _outputDevices?: OppioHardwareAudioDevice[];

  @internalProperty() private _selectedInput!: null | string;

  @internalProperty() private _selectedOutput!: null | string;

  protected render(): TemplateResult {
    return html`
      <ha-card
        .header=${this.supervisor.localize("addon.configuration.audio.header")}
      >
        <div class="card-content">
          ${this._error ? html` <div class="errors">${this._error}</div> ` : ""}

          <paper-dropdown-menu
            .label=${this.supervisor.localize(
              "addon.configuration.audio.input"
            )}
            @iron-select=${this._setInputDevice}
          >
            <paper-listbox
              slot="dropdown-content"
              attr-for-selected="device"
              .selected=${this._selectedInput!}
            >
              ${this._inputDevices &&
              this._inputDevices.map((item) => {
                return html`
                  <paper-item device=${item.device || ""}>
                    ${item.name}
                  </paper-item>
                `;
              })}
            </paper-listbox>
          </paper-dropdown-menu>
          <paper-dropdown-menu
            .label=${this.supervisor.localize(
              "addon.configuration.audio.output"
            )}
            @iron-select=${this._setOutputDevice}
          >
            <paper-listbox
              slot="dropdown-content"
              attr-for-selected="device"
              .selected=${this._selectedOutput!}
            >
              ${this._outputDevices &&
              this._outputDevices.map((item) => {
                return html`
                  <paper-item device=${item.device || ""}
                    >${item.name}</paper-item
                  >
                `;
              })}
            </paper-listbox>
          </paper-dropdown-menu>
        </div>
        <div class="card-actions">
          <ha-progress-button @click=${this._saveSettings}>
            ${this.supervisor.localize("common.save")}
          </ha-progress-button>
        </div>
      </ha-card>
    `;
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      oppioStyle,
      css`
        :host,
        ha-card,
        paper-dropdown-menu {
          display: block;
        }
        .errors {
          color: var(--error-color);
          margin-bottom: 16px;
        }
        paper-item {
          width: 450px;
        }
        .card-actions {
          text-align: right;
        }
      `,
    ];
  }

  protected update(changedProperties: PropertyValues): void {
    super.update(changedProperties);
    if (changedProperties.has("addon")) {
      this._addonChanged();
    }
  }

  private _setInputDevice(ev): void {
    const device = ev.detail.item.getAttribute("device");
    this._selectedInput = device;
  }

  private _setOutputDevice(ev): void {
    const device = ev.detail.item.getAttribute("device");
    this._selectedOutput = device;
  }

  private async _addonChanged(): Promise<void> {
    this._selectedInput =
      this.addon.audio_input === null ? "default" : this.addon.audio_input;
    this._selectedOutput =
      this.addon.audio_output === null ? "default" : this.addon.audio_output;
    if (this._outputDevices) {
      return;
    }

    const noDevice: OppioHardwareAudioDevice = {
      device: "default",
      name: this.supervisor.localize("addon.configuration.audio.default"),
    };

    try {
      const { audio } = await fetchOppioHardwareAudio(this.opp);
      const input = Object.keys(audio.input).map((key) => ({
        device: key,
        name: audio.input[key],
      }));
      const output = Object.keys(audio.output).map((key) => ({
        device: key,
        name: audio.output[key],
      }));

      this._inputDevices = [noDevice, ...input];
      this._outputDevices = [noDevice, ...output];
    } catch {
      this._error = "Failed to fetch audio hardware";
      this._inputDevices = [noDevice];
      this._outputDevices = [noDevice];
    }
  }

  private async _saveSettings(ev: CustomEvent): Promise<void> {
    const button = ev.currentTarget as any;
    button.progress = true;

    this._error = undefined;
    const data: OppioAddonSetOptionParams = {
      audio_input:
        this._selectedInput === "default" ? null : this._selectedInput,
      audio_output:
        this._selectedOutput === "default" ? null : this._selectedOutput,
    };
    try {
      await setOppioAddonOption(this.opp, this.addon.slug, data);
      if (this.addon?.state === "started") {
        await suggestAddonRestart(this, this.opp, this.supervisor, this.addon);
      }
    } catch {
      this._error = "Failed to set addon audio device";
    }

    button.progress = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-addon-audio": OppioAddonAudio;
  }
}
