import "../components/ha-card";
import "@material/mwc-button";
import {
  css,
  CSSResultArray,
  customElement,
  html,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { OpenPeerPower } from "../types";
import "../resources/ha-style";
import { haStyle } from "../resources/styles";
import { applyThemesOnElement } from "../common/dom/apply_themes_on_element";
import { atLeastVersion } from "../common/config/version";
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
        <ha-card header="Troubleshooting">
          <div class="card-content">
            <ol>
              <li>
                ${this.opp.localize("ui.errors.supervisor.wait")}
              </li>
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
              <li>
                ${this.opp.localize("ui.errors.supervisor.reboot")}
              </li>
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
        </ha-card>
      </opp-subpage>
    `;
  }

  private _applyTheme() {
    let themeName: string;
    let options: Partial<OpenPeerPower["selectedTheme"]> | undefined;

    if (atLeastVersion(this.opp.config.version, 0, 114)) {
      themeName =
        this.opp.selectedTheme?.theme ||
        (this.opp.themes.darkMode && this.opp.themes.default_dark_theme
          ? this.opp.themes.default_dark_theme!
          : this.opp.themes.default_theme);

      options = this.opp.selectedTheme;
      if (themeName === "default" && options?.dark === undefined) {
        options = {
          ...this.opp.selectedTheme,
          dark: this.opp.themes.darkMode,
        };
      }
    } else {
      themeName =
        ((this.opp.selectedTheme as unknown) as string) ||
        this.opp.themes.default_theme;
    }

    applyThemesOnElement(
      this.parentElement,
      this.opp.themes,
      themeName,
      options
    );
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        a {
          color: var(--mdc-theme-primary);
        }

        ha-card {
          width: 600px;
          margin: auto;
          padding: 8px;
        }
        @media all and (max-width: 500px) {
          ha-card {
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
