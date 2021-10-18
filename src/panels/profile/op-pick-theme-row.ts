import "@material/mwc-button/mwc-button";
import "@polymer/paper-input/paper-input";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import {
  css,
  CSSResult,
  customElement,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
} from "lit-element";
import { html, TemplateResult } from "lit-html";
import { fireEvent } from "../../common/dom/fire_event";
import "../../components/op-formfield";
import "../../components/op-paper-dropdown-menu";
import "../../components/op-radio";
import type { HaRadio } from "../../components/op-radio";
import "../../components/op-settings-row";
import { OpenPeerPower } from "../../types";
import { documentationUrl } from "../../util/documentation-url";

@customElement("op-pick-theme-row")
export class HaPickThemeRow extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ type: Boolean }) public narrow!: boolean;

  @internalProperty() _themes: string[] = [];

  @internalProperty() _selectedTheme = 0;

  protected render(): TemplateResult {
    const hasThemes =
      this.opp.themes?.themes && Object.keys(this.opp.themes.themes).length;
    const curTheme =
      this.opp!.selectedTheme?.theme || this.opp!.themes.default_theme;
    return html`
      <op-settings-row .narrow=${this.narrow}>
        <span slot="heading"
          >${this.opp.localize("ui.panel.profile.themes.header")}</span
        >
        <span slot="description">
          ${!hasThemes
            ? this.opp.localize("ui.panel.profile.themes.error_no_theme")
            : ""}
          <a
            href="${documentationUrl(
              this.opp!,
              "/integrations/frontend/#defining-themes"
            )}"
            target="_blank"
            rel="noreferrer"
          >
            ${this.opp.localize("ui.panel.profile.themes.link_promo")}
          </a>
        </span>
        <op-paper-dropdown-menu
          .label=${this.opp.localize("ui.panel.profile.themes.dropdown_label")}
          dynamic-align
          .disabled=${!hasThemes}
        >
          <paper-listbox
            slot="dropdown-content"
            .selected=${this._selectedTheme}
            @iron-select=${this._handleThemeSelection}
          >
            ${this._themes.map(
              (theme) => html`<paper-item .theme=${theme}>${theme}</paper-item>`
            )}
          </paper-listbox>
        </op-paper-dropdown-menu>
      </op-settings-row>
      ${curTheme === "default"
        ? html` <div class="inputs">
            <op-formfield
              .label=${this.opp!.localize(
                "ui.panel.profile.themes.dark_mode.auto"
              )}
            >
              <op-radio
                @change=${this._handleDarkMode}
                name="dark_mode"
                value="auto"
                ?checked=${this.opp.selectedTheme?.dark === undefined}
              ></op-radio>
            </op-formfield>
            <op-formfield
              .label=${this.opp!.localize(
                "ui.panel.profile.themes.dark_mode.light"
              )}
            >
              <op-radio
                @change=${this._handleDarkMode}
                name="dark_mode"
                value="light"
                ?checked=${this.opp.selectedTheme?.dark === false}
              >
              </op-radio>
            </op-formfield>
            <op-formfield
              .label=${this.opp!.localize(
                "ui.panel.profile.themes.dark_mode.dark"
              )}
            >
              <op-radio
                @change=${this._handleDarkMode}
                name="dark_mode"
                value="dark"
                ?checked=${this.opp.selectedTheme?.dark === true}
              >
              </op-radio>
            </op-formfield>
            <div class="color-pickers">
              <paper-input
                .value=${this.opp!.selectedTheme?.primaryColor || "#03a9f4"}
                type="color"
                .label=${this.opp!.localize(
                  "ui.panel.profile.themes.primary_color"
                )}
                .name=${"primaryColor"}
                @change=${this._handleColorChange}
              ></paper-input>
              <paper-input
                .value=${this.opp!.selectedTheme?.accentColor || "#ff9800"}
                type="color"
                .label=${this.opp!.localize(
                  "ui.panel.profile.themes.accent_color"
                )}
                .name=${"accentColor"}
                @change=${this._handleColorChange}
              ></paper-input>
              ${this.opp!.selectedTheme?.primaryColor ||
              this.opp!.selectedTheme?.accentColor
                ? html` <mwc-button @click=${this._resetColors}>
                    ${this.opp!.localize("ui.panel.profile.themes.reset")}
                  </mwc-button>`
                : ""}
            </div>
          </div>`
        : ""}
    `;
  }

  protected updated(changedProperties: PropertyValues) {
    const oldOpp = changedProperties.get("opp") as undefined | OpenPeerPower;
    const themesChanged =
      changedProperties.has("opp") &&
      (!oldOpp || oldOpp.themes?.themes !== this.opp.themes?.themes);
    const selectedThemeChanged =
      changedProperties.has("opp") &&
      (!oldOpp || oldOpp.selectedTheme !== this.opp.selectedTheme);

    if (themesChanged) {
      this._themes = ["Backend-selected", "default"].concat(
        Object.keys(this.opp.themes.themes).sort()
      );
    }

    if (selectedThemeChanged) {
      if (
        this.opp.selectedTheme &&
        this._themes.indexOf(this.opp.selectedTheme.theme) > 0
      ) {
        this._selectedTheme = this._themes.indexOf(
          this.opp.selectedTheme.theme
        );
      } else if (!this.opp.selectedTheme) {
        this._selectedTheme = 0;
      }
    }
  }

  private _handleColorChange(ev: CustomEvent) {
    const target = ev.target as any;
    fireEvent(this, "settheme", { [target.name]: target.value });
  }

  private _resetColors() {
    fireEvent(this, "settheme", {
      primaryColor: undefined,
      accentColor: undefined,
    });
  }

  private _handleDarkMode(ev: CustomEvent) {
    let dark: boolean | undefined;
    switch ((ev.target as HaRadio).value) {
      case "light":
        dark = false;
        break;
      case "dark":
        dark = true;
        break;
    }
    fireEvent(this, "settheme", { dark });
  }

  private _handleThemeSelection(ev: CustomEvent) {
    const theme = ev.detail.item.theme;
    if (theme === "Backend-selected") {
      if (this.opp.selectedTheme?.theme) {
        fireEvent(this, "settheme", { theme: "" });
      }
      return;
    }
    fireEvent(this, "settheme", { theme });
  }

  static get styles(): CSSResult {
    return css`
      a {
        color: var(--primary-color);
      }
      .inputs {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        margin: 0 12px;
      }
      op-formfield {
        margin: 0 4px;
      }
      .color-pickers {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        flex-grow: 1;
      }
      paper-input {
        min-width: 75px;
        flex-grow: 1;
        margin: 0 4px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-pick-theme-row": HaPickThemeRow;
  }
}
