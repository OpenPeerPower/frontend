import { atLeastVersion } from "../common/config/version";
import { computeLocalize, LocalizeFunc } from "../common/translations/localize";
import { computeRTL } from "../common/util/compute_rtl";
import { debounce } from "../common/util/debounce";
import {
  getOppTranslations,
  getOppTranslationsPre109,
  NumberFormat,
  saveTranslationPreferences,
  TranslationCategory,
} from "../data/translation";
import { translationMetadata } from "../resources/translations-metadata";
import { Constructor, OpenPeerPower } from "../types";
import { storeState } from "../util/ha-pref-storage";
import {
  getTranslation,
  getLocalLanguage,
  getUserLocale,
} from "../util/opp-translation";
import { OppBaseEl } from "./opp-base-mixin";

declare global {
  // for fire event
  interface OPPDomEvents {
    "opp-language-select": {
      language: string;
    };
    "opp-number-format-select": {
      number_format: NumberFormat;
    };
  }
}

interface LoadedTranslationCategory {
  // individual integrations loaded for this category
  integrations: string[];
  // if integrations that have been set up for this category are loaded
  setup: boolean;
  // if
  configFlow: boolean;
}

/*
 * superClass needs to contain `this.opp` and `this._updateOpp`.
 */

export default <T extends Constructor<OppBaseEl>>(superClass: T) =>
  class extends superClass {
    // eslint-disable-next-line: variable-name
    private __coreProgress?: string;

    private __loadedFragmetTranslations: Set<string> = new Set();

    private __loadedTranslations: {
      // track what things have been loaded
      [category: string]: LoadedTranslationCategory;
    } = {};

    protected firstUpdated(changedProps) {
      super.firstUpdated(changedProps);
      this.addEventListener("opp-language-select", (e) => {
        this._selectLanguage((e as CustomEvent).detail, true);
      });
      this.addEventListener("opp-number-format-select", (e) => {
        this._selectNumberFormat((e as CustomEvent).detail, true);
      });
      this._loadCoreTranslations(getLocalLanguage());
    }

    protected updated(changedProps) {
      super.updated(changedProps);
      if (!changedProps.has("opp")) {
        return;
      }
      const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
      if (
        this.opp?.panels &&
        (!oldOpp || oldOpp.panels !== this.opp.panels)
      ) {
        this._loadFragmentTranslations(this.opp.language, this.opp.panelUrl);
      }
    }

    protected oppConnected() {
      super.oppConnected();
      getUserLocale(this.opp!).then((locale) => {
        if (locale?.language && this.opp!.language !== locale.language) {
          // We just got language from backend, no need to save back
          this._selectLanguage(locale.language, false);
        }
        if (
          locale?.number_format &&
          this.opp!.locale.number_format !== locale.number_format
        ) {
          // We just got number_format from backend, no need to save back
          this._selectNumberFormat(locale.number_format, false);
        }
      });

      this.opp!.connection.subscribeEvents(
        debounce(() => {
          this._refetchCachedOppTranslations(false, false);
        }, 500),
        "component_loaded"
      );
      this._applyTranslations(this.opp!);
    }

    protected oppReconnected() {
      super.oppReconnected();
      this._refetchCachedOppTranslations(true, false);
      this._applyTranslations(this.opp!);
    }

    protected panelUrlChanged(newPanelUrl) {
      super.panelUrlChanged(newPanelUrl);
      // this may be triggered before oppConnected
      this._loadFragmentTranslations(
        this.opp ? this.opp.language : getLocalLanguage(),
        newPanelUrl
      );
    }

    private _selectNumberFormat(
      number_format: NumberFormat,
      saveToBackend: boolean
    ) {
      this._updateOpp({
        locale: { ...this.opp!.locale, number_format: number_format },
      });
      if (saveToBackend) {
        saveTranslationPreferences(this.opp!, this.opp!.locale);
      }
    }

    private _selectLanguage(language: string, saveToBackend: boolean) {
      if (!this.opp) {
        // should not happen, do it to avoid use this.opp!
        return;
      }

      // update selectedLanguage so that it can be saved to local storage
      this._updateOpp({
        locale: { ...this.opp!.locale, language: language },
        language: language,
        selectedLanguage: language,
      });
      storeState(this.opp);
      if (saveToBackend) {
        saveTranslationPreferences(this.opp, this.opp.locale);
      }
      this._applyTranslations(this.opp);
      this._refetchCachedOppTranslations(true, true);
    }

    private _applyTranslations(opp: OpenPeerPower) {
      document.querySelector("html")!.setAttribute("lang", opp.language);
      this.style.direction = computeRTL(opp) ? "rtl" : "ltr";
      this._loadCoreTranslations(opp.language);
      this.__loadedFragmetTranslations = new Set();
      this._loadFragmentTranslations(opp.language, opp.panelUrl);
    }

    /**
     * Load translations from the backend
     * @param language language to fetch
     * @param category category to fetch
     * @param integration optional, if having to fetch for specific integration
     * @param configFlow optional, if having to fetch for all integrations with a config flow
     * @param force optional, load even if already cached
     */
    private async _loadOppTranslations(
      language: string,
      category: Parameters<typeof getOppTranslations>[2],
      integration?: Parameters<typeof getOppTranslations>[3],
      configFlow?: Parameters<typeof getOppTranslations>[4],
      force = false
    ): Promise<LocalizeFunc> {
      if (
        __BACKWARDS_COMPAT__ &&
        !atLeastVersion(this.opp!.connection.haVersion, 0, 109)
      ) {
        if (category !== "state") {
          return this.opp!.localize;
        }
        const resources = await getOppTranslationsPre109(this.opp!, language);

        // Ignore the repsonse if user switched languages before we got response
        if (this.opp!.language !== language) {
          return this.opp!.localize;
        }

        await this._updateResources(language, resources);
        return this.opp!.localize;
      }

      let alreadyLoaded: LoadedTranslationCategory;

      if (category in this.__loadedTranslations) {
        alreadyLoaded = this.__loadedTranslations[category];
      } else {
        alreadyLoaded = this.__loadedTranslations[category] = {
          integrations: [],
          setup: false,
          configFlow: false,
        };
      }

      // Check if already loaded
      if (!force) {
        if (integration) {
          if (alreadyLoaded.integrations.includes(integration)) {
            return this.opp!.localize;
          }
        } else if (
          configFlow ? alreadyLoaded.configFlow : alreadyLoaded.setup
        ) {
          return this.opp!.localize;
        }
      }

      // Add to cache
      if (integration) {
        if (!alreadyLoaded.integrations.includes(integration)) {
          alreadyLoaded.integrations.push(integration);
        }
      } else {
        alreadyLoaded.setup = true;
        if (configFlow) {
          alreadyLoaded.configFlow = true;
        }
      }

      const resources = await getOppTranslations(
        this.opp!,
        language,
        category,
        integration,
        configFlow
      );

      // Ignore the repsonse if user switched languages before we got response
      if (this.opp!.language !== language) {
        return this.opp!.localize;
      }

      await this._updateResources(language, resources);
      return this.opp!.localize;
    }

    private async _loadFragmentTranslations(
      language: string,
      panelUrl: string
    ) {
      if (!panelUrl) {
        return;
      }
      const panelComponent = this.opp?.panels?.[panelUrl]?.component_name;

      // If it's the first call we don't have panel info yet to check the component.
      const fragment = translationMetadata.fragments.includes(
        panelComponent || panelUrl
      )
        ? panelComponent || panelUrl
        : undefined;

      if (!fragment) {
        return;
      }

      if (this.__loadedFragmetTranslations.has(fragment)) {
        return;
      }
      this.__loadedFragmetTranslations.add(fragment);
      const result = await getTranslation(fragment, language);
      await this._updateResources(result.language, result.data);
    }

    private async _loadCoreTranslations(language: string) {
      // Check if already in progress
      // Necessary as we call this in firstUpdated and oppConnected
      if (this.__coreProgress === language) {
        return;
      }
      this.__coreProgress = language;
      try {
        const result = await getTranslation(null, language);
        await this._updateResources(result.language, result.data);
      } finally {
        this.__coreProgress = undefined;
      }
    }

    private async _updateResources(language: string, data: any) {
      // Update the language in opp, and update the resources with the newly
      // loaded resources. This merges the new data on top of the old data for
      // this language, so that the full translation set can be loaded across
      // multiple fragments.
      //
      // Beware of a subtle race condition: it is possible to get here twice
      // before this.opp is even created. In this case our base state comes
      // from this._pendingOpp instead. Otherwise the first set of strings is
      // overwritten when we call _updateOpp the second time!

      // Allow opp to be updated
      await new Promise((resolve) => setTimeout(resolve, 0));

      if (language !== (this.opp ?? this._pendingOpp).language) {
        // the language was changed, abort
        return;
      }

      const resources = {
        [language]: {
          ...(this.opp ?? this._pendingOpp)?.resources?.[language],
          ...data,
        },
      };
      const changes: Partial<OpenPeerPower> = {
        resources,
        localize: await computeLocalize(this, language, resources),
      };

      if (language === (this.opp ?? this._pendingOpp).language) {
        this._updateOpp(changes);
      }
    }

    private _refetchCachedOppTranslations(
      includeConfigFlow: boolean,
      clearIntegrations: boolean
    ) {
      for (const [category, cache] of Object.entries(
        this.__loadedTranslations
      )) {
        if (clearIntegrations) {
          cache.integrations = [];
        }
        if (cache.setup) {
          this._loadOppTranslations(
            this.opp!.language,
            category as TranslationCategory,
            undefined,
            includeConfigFlow && cache.configFlow,
            true
          );
        }
      }
    }
  };
