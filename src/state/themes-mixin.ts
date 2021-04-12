import {
  applyThemesOnElement,
  invalidateThemeCache,
} from "../common/dom/apply_themes_on_element";
import { OPPDomEvent } from "../common/dom/fire_event";
import { subscribeThemes } from "../data/ws-themes";
import { Constructor, OpenPeerPower } from "../types";
import { storeState } from "../util/ha-pref-storage";
import { OppBaseEl } from "./opp-base-mixin";

declare global {
  // for add event listener
  interface HTMLElementEventMap {
    settheme: OPPDomEvent<Partial<OpenPeerPower["selectedTheme"]>>;
  }
  interface OPPDomEvents {
    settheme: Partial<OpenPeerPower["selectedTheme"]>;
  }
}

const mql = matchMedia("(prefers-color-scheme: dark)");

export default <T extends Constructor<OppBaseEl>>(superClass: T) =>
  class extends superClass {
    protected firstUpdated(changedProps) {
      super.firstUpdated(changedProps);
      this.addEventListener("settheme", (ev) => {
        this._updateOpp({
          selectedTheme: { ...this.opp!.selectedTheme!, ...ev.detail },
        });
        this._applyTheme(mql.matches);
        storeState(this.opp!);
      });
      mql.addListener((ev) => this._applyTheme(ev.matches));
    }

    protected oppConnected() {
      super.oppConnected();

      subscribeThemes(this.opp!.connection, (themes) => {
        this._updateOpp({ themes });
        invalidateThemeCache();
        this._applyTheme(mql.matches);
      });
    }

    private _applyTheme(dark: boolean) {
      if (!this.opp) {
        return;
      }
      const themeName =
        this.opp.selectedTheme?.theme ||
        (dark && this.opp.themes.default_dark_theme
          ? this.opp.themes.default_dark_theme!
          : this.opp.themes.default_theme);

      let options: Partial<OpenPeerPower["selectedTheme"]> = this.opp!
        .selectedTheme;

      if (themeName === "default" && options?.dark === undefined) {
        options = {
          ...this.opp.selectedTheme!,
          dark,
        };
      }

      applyThemesOnElement(
        document.documentElement,
        this.opp.themes,
        themeName,
        options
      );

      const darkMode =
        themeName === "default"
          ? !!options?.dark
          : !!(dark && this.opp.themes.default_dark_theme);

      if (darkMode !== this.opp.themes.darkMode) {
        this._updateOpp({
          themes: { ...this.opp.themes, darkMode },
        });

        const schemeMeta = document.querySelector("meta[name=color-scheme]");
        if (schemeMeta) {
          schemeMeta.setAttribute(
            "content",
            darkMode ? "dark" : themeName === "default" ? "light" : "dark light"
          );
        }
      }

      const themeMeta = document.querySelector("meta[name=theme-color]");
      const computedStyles = getComputedStyle(document.documentElement);
      const headerColor = computedStyles.getPropertyValue(
        "--app-header-background-color"
      );

      document.documentElement.style.backgroundColor = computedStyles.getPropertyValue(
        "--primary-background-color"
      );

      if (themeMeta) {
        if (!themeMeta.hasAttribute("default-content")) {
          themeMeta.setAttribute(
            "default-content",
            themeMeta.getAttribute("content")!
          );
        }
        const themeColor =
          headerColor?.trim() ||
          (themeMeta.getAttribute("default-content") as string);
        themeMeta.setAttribute("content", themeColor);
      }
    }
  };
