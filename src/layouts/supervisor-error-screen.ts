import "@material/mwc-button";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { customElement, property } from "lit/decorators";
import { atLeastVersion } from "../common/config/version";
import { applyThemesOnElement } from "../common/dom/apply_themes_on_element";
import "../components/op-card";
import "../resources/op-style";
import { haStyle } from "../resources/styles";
import { OpenPeerPower } from "../types";
import "./opp-subpage";

@customElement("supervisor-error-screen")
class SupervisorErrorScreen extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);

    this._applyTheme();
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
    if (!oldOpp) {
      return;
    }
    if (oldOpp.themes !== this.opp.themes) {
      this._applyTheme();
    }
  }

  protected render(): TemplateResult {
    return html`
      <opp-subpage
        .opp=${this.opp}
        .header=${this.opp.localize("ui.errors.supervisor.title")}
      >
        <op-card header="Troubleshooting">
          <div class="card-content">
            <ol>
              <li>${this.opp.localize("ui.errors.supervisor.wait")}</li>
              <li>
                <a
                  class="supervisor_error-link"
                  href="http://openpeerpower.local:4357"
                  target="_blank"
                  rel="noreferrer"
                >
                  ${this.opp.localize("ui.errors.supervisor.observer")}
                </a>
              </li>
              <li>${this.opp.localize("ui.errors.supervisor.reboot")}</li>
              <li>
                <a href="/config/info" target="_parent">
                  ${this.opp.localize("ui.errors.supervisor.system_health")}
                </a>
              </li>
              <li>
                <a
                  href="https://www.openpeerpower.io/help/"
                  target="_blank"
                  rel="noreferrer"
                >
                  ${this.opp.localize("ui.errors.supervisor.ask")}
                </a>
              </li>
            </ol>
          </div>
        </op-card>
      </opp-subpage>
    `;
  }

  private _applyTheme() {
    let themeName: string;
    let themeSettings: Partial<OpenPeerPower["selectedTheme"]> | undefined;

    if (atLeastVersion(this.opp.config.version, 0, 114)) {
      themeName =
        this.opp.selectedTheme?.theme ||
        (this.opp.themes.darkMode && this.opp.themes.default_dark_theme
          ? this.opp.themes.default_dark_theme!
          : this.opp.themes.default_theme);

      themeSettings = this.opp.selectedTheme;
      if (themeName === "default" && themeSettings?.dark === undefined) {
        themeSettings = {
          ...this.opp.selectedTheme,
          dark: this.opp.themes.darkMode,
        };
      }
    } else {
      themeName =
        (this.opp.selectedTheme as unknown as string) ||
        this.opp.themes.default_theme;
    }

    applyThemesOnElement(
      this.parentElement,
      this.opp.themes,
      themeName,
      themeSettings
    );
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      css`
        a {
          color: var(--mdc-theme-primary);
        }

        op-card {
          width: 600px;
          margin: auto;
          padding: 8px;
        }
        @media all and (max-width: 500px) {
          op-card {
            width: calc(100vw - 32px);
          }
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "supervisor-error-screen": SupervisorErrorScreen;
  }
}
