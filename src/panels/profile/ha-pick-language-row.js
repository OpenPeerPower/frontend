import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import "../../components/ha-paper-dropdown-menu";
import "../../components/ha-settings-row";
import { EventsMixin } from "../../mixins/events-mixin";
import LocalizeMixin from "../../mixins/localize-mixin";

/*
 * @appliesMixin LocalizeMixin
 * @appliesMixin EventsMixin
 */
class HaPickLanguageRow extends LocalizeMixin(EventsMixin(PolymerElement)) {
  static get template() {
    return html`
      <style>
        a {
          color: var(--primary-color);
        }
        paper-item {
          direction: ltr;
        }
        paper-item[is-rtl] {
          direction: rtl;
        }
      </style>
      <ha-settings-row narrow="[[narrow]]">
        <span slot="heading"
          >[[localize('ui.panel.profile.language.header')]]</span
        >
        <span slot="description">
          <a
            href="https://developers.openpeerpower.io/docs/en/internationalization_translation.html"
            target="_blank"
            rel="noreferrer"
            >[[localize('ui.panel.profile.language.link_promo')]]</a
          >
        </span>
        <ha-paper-dropdown-menu
          label="[[localize('ui.panel.profile.language.dropdown_label')]]"
          dynamic-align=""
        >
          <paper-listbox
            slot="dropdown-content"
            attr-for-selected="language-tag"
            selected="{{languageSelection}}"
          >
            <template is="dom-repeat" items="[[languages]]">
              <paper-item language-tag$="[[item.key]]" is-rtl$="[[item.isRTL]]">
                [[item.nativeName]]
              </paper-item>
            </template>
          </paper-listbox>
        </ha-paper-dropdown-menu>
      </ha-settings-row>
    `;
  }

  static get properties() {
    return {
      opp: Object,
      narrow: Boolean,
      languageSelection: {
        type: String,
        observer: "languageSelectionChanged",
      },
      languages: {
        type: Array,
        computed: "computeLanguages(opp)",
      },
    };
  }

  static get observers() {
    return ["setLanguageSelection(language)"];
  }

  computeLanguages(opp) {
    if (!opp || !opp.translationMetadata) {
      return [];
    }
    const translations = opp.translationMetadata.translations;
    return Object.keys(translations).map((key) => ({
      key,
      ...translations[key],
    }));
  }

  setLanguageSelection(language) {
    this.languageSelection = language;
  }

  languageSelectionChanged(newVal) {
    // Only fire event if language was changed. This prevents select updates when
    // responding to opp changes.
    if (newVal !== this.opp.language) {
      this.fire("opp-language-select", newVal);
    }
  }

  ready() {
    super.ready();
    if (this.opp && this.opp.locale && this.opp.locale.language) {
      this.setLanguageSelection(this.opp.locale.language);
    }
  }
}

customElements.define("ha-pick-language-row", HaPickLanguageRow);
