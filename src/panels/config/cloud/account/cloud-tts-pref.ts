import "@polymer/paper-dropdown-menu/paper-dropdown-menu-light";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import "@material/mwc-button";
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
import "../../../../components/ha-card";
import "../../../../components/ha-switch";
import "../../../../components/ha-svg-icon";
import {
  CloudStatusLoggedIn,
  CloudTTSInfo,
  getCloudTTSInfo,
  updateCloudPref,
} from "../../../../data/cloud";
import type { OpenPeerPower } from "../../../../types";
import { showAlertDialog } from "../../../../dialogs/generic/show-dialog-box";
import { translationMetadata } from "../../../../resources/translations-metadata";
import { caseInsensitiveCompare } from "../../../../common/string/compare";
import memoizeOne from "memoize-one";
import { fireEvent } from "../../../../common/dom/fire_event";
import { showTryTtsDialog } from "./show-dialog-cloud-tts-try";

@customElement("cloud-tts-pref")
export class CloudTTSPref extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public cloudStatus?: CloudStatusLoggedIn;

  @internalProperty() private savingPreferences = false;

  @internalProperty() private ttsInfo?: CloudTTSInfo;

  protected render(): TemplateResult {
    if (!this.cloudStatus) {
      return html``;
    }

    const languages = this.getLanguages(this.ttsInfo);
    const defaultVoice = this.cloudStatus.prefs.tts_default_voice;
    const genders = this.getSupportedGenders(defaultVoice[0], this.ttsInfo);

    return html`
      <ha-card
        header=${this.opp.localize("ui.panel.config.cloud.account.tts.title")}
      >
        <div class="card-content">
          ${this.opp.localize(
            "ui.panel.config.cloud.account.tts.info",
            "service",
            '"tts.cloud_say"'
          )}
          <br /><br />

          <paper-dropdown-menu-light
            .label=${this.opp.localize(
              "ui.panel.config.cloud.account.tts.default_language"
            )}
            .disabled=${this.savingPreferences}
          >
            <paper-listbox
              slot="dropdown-content"
              .selected=${defaultVoice[0]}
              attr-for-selected="value"
              @iron-select=${this._handleLanguageChange}
            >
              ${languages.map(
                ([key, label]) =>
                  html`<paper-item .value=${key}>${label}</paper-item>`
              )}
            </paper-listbox>
          </paper-dropdown-menu-light>

          <paper-dropdown-menu-light .disabled=${this.savingPreferences}>
            <paper-listbox
              slot="dropdown-content"
              .selected=${defaultVoice[1]}
              attr-for-selected="value"
              @iron-select=${this._handleGenderChange}
            >
              ${genders.map(
                ([key, label]) =>
                  html`<paper-item .value=${key}>${label}</paper-item>`
              )}
            </paper-listbox>
          </paper-dropdown-menu-light>
        </div>
        <div class="card-actions">
          <mwc-button @click=${this._openTryDialog}>
            ${this.opp.localize("ui.panel.config.cloud.account.tts.try")}
          </mwc-button>
        </div>
      </ha-card>
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    getCloudTTSInfo(this.opp).then((info) => {
      this.ttsInfo = info;
    });
  }

  protected updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has("cloudStatus")) {
      this.savingPreferences = false;
    }
  }

  private getLanguages = memoizeOne((info?: CloudTTSInfo) => {
    const languages: Array<[string, string]> = [];

    if (!info) {
      return languages;
    }

    const seen = new Set<string>();
    for (const [lang] of info.languages) {
      if (seen.has(lang)) {
        continue;
      }
      seen.add(lang);

      let label = lang;

      if (lang in translationMetadata.translations) {
        label = translationMetadata.translations[lang].nativeName;
      } else {
        const [langFamily, dialect] = lang.split("-");
        if (langFamily in translationMetadata.translations) {
          label = `${translationMetadata.translations[langFamily].nativeName}`;

          if (langFamily.toLowerCase() !== dialect.toLowerCase()) {
            label += ` (${dialect})`;
          }
        }
      }

      languages.push([lang, label]);
    }
    return languages.sort((a, b) => caseInsensitiveCompare(a[1], b[1]));
  });

  private getSupportedGenders = memoizeOne(
    (language: string, info?: CloudTTSInfo) => {
      const genders: Array<[string, string]> = [];

      if (!info) {
        return genders;
      }

      for (const [curLang, gender] of info.languages) {
        if (curLang === language) {
          genders.push([
            gender,
            this.opp.localize(`ui.panel.config.cloud.account.tts.${gender}`) ||
              gender,
          ]);
        }
      }

      return genders.sort((a, b) => caseInsensitiveCompare(a[1], b[1]));
    }
  );

  private _openTryDialog() {
    showTryTtsDialog(this, {
      defaultVoice: this.cloudStatus!.prefs.tts_default_voice,
    });
  }

  async _handleLanguageChange(ev) {
    if (ev.detail.item.value === this.cloudStatus!.prefs.tts_default_voice[0]) {
      return;
    }
    this.savingPreferences = true;
    const language = ev.detail.item.value;

    const curGender = this.cloudStatus!.prefs.tts_default_voice[1];
    const genders = this.getSupportedGenders(language, this.ttsInfo);
    const newGender = genders.find((item) => item[0] === curGender)
      ? curGender
      : genders[0][0];

    try {
      await updateCloudPref(this.opp, {
        tts_default_voice: [language, newGender],
      });
      fireEvent(this, "ha-refresh-cloud-status");
    } catch (err) {
      this.savingPreferences = false;
      // eslint-disable-next-line no-console
      console.error(err);
      showAlertDialog(this, {
        text: `Unable to save default language. ${err}`,
        warning: true,
      });
    }
  }

  async _handleGenderChange(ev) {
    if (ev.detail.item.value === this.cloudStatus!.prefs.tts_default_voice[1]) {
      return;
    }
    this.savingPreferences = true;
    const language = this.cloudStatus!.prefs.tts_default_voice[0];
    const gender = ev.detail.item.value;

    try {
      await updateCloudPref(this.opp, {
        tts_default_voice: [language, gender],
      });
      fireEvent(this, "ha-refresh-cloud-status");
    } catch (err) {
      this.savingPreferences = false;
      // eslint-disable-next-line no-console
      console.error(err);
      showAlertDialog(this, {
        text: `Unable to save default gender. ${err}`,
        warning: true,
      });
    }
  }

  static get styles(): CSSResult {
    return css`
      a {
        color: var(--primary-color);
      }
      .example {
        position: absolute;
        right: 16px;
        top: 16px;
      }
      :host([dir="rtl"]) .example {
        right: auto;
        left: 24px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cloud-tts-pref": CloudTTSPref;
  }
}
