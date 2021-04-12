import { customElement, html, property, PropertyValues } from "lit-element";
import { atLeastVersion } from "../../src/common/config/version";
import { applyThemesOnElement } from "../../src/common/dom/apply_themes_on_element";
import { fireEvent } from "../../src/common/dom/fire_event";
import { OppioPanelInfo } from "../../src/data/oppio/supervisor";
import { Supervisor } from "../../src/data/supervisor/supervisor";
import { makeDialogManager } from "../../src/dialogs/make-dialog-manager";
import "../../src/layouts/opp-loading-screen";
import { OpenPeerPower, Route } from "../../src/types";
import "./oppio-router";
import { SupervisorBaseElement } from "./supervisor-base-element";

@customElement("oppio-main")
export class OppioMain extends SupervisorBaseElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ attribute: false }) public panel!: OppioPanelInfo;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ attribute: false }) public route?: Route;

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);

    this._applyTheme();

    // Paulus - March 17, 2019
    // We went to a single opp-toggle-menu event in OP 0.90. However, the
    // supervisor UI can also run under older versions of Open Peer Power.
    // So here we are going to translate toggle events into the appropriate
    // open and close events. These events are a no-op in newer versions of
    // Open Peer Power.
    this.addEventListener("opp-toggle-menu", () => {
      fireEvent(
        (window.parent as any).customPanel,
        // @ts-ignore
        this.opp.dockedSidebar ? "opp-close-menu" : "opp-open-menu"
      );
    });
    // Paulus - March 19, 2019
    // We changed the navigate event to fire directly on the window, as that's
    // where we are listening for it. However, the older panel_custom will
    // listen on this element for navigation events, so we need to forward them.
    window.addEventListener("location-changed", (ev) =>
      // @ts-ignore
      fireEvent(this, ev.type, ev.detail, {
        bubbles: false,
      })
    );

    // Forward haptic events to parent window.
    window.addEventListener("haptic", (ev) => {
      // @ts-ignore
      fireEvent(window.parent, ev.type, ev.detail, {
        bubbles: false,
      });
    });

    makeDialogManager(this, this.shadowRoot!);
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

  protected render() {
    return html`
      <oppio-router
        .opp=${this.opp}
        .supervisor=${this.supervisor}
        .route=${this.route}
        .panel=${this.panel}
        .narrow=${this.narrow}
      ></oppio-router>
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
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-main": OppioMain;
  }
}
