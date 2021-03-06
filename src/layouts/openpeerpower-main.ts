import "@polymer/app-layout/app-drawer-layout/app-drawer-layout";
import type { AppDrawerLayoutElement } from "@polymer/app-layout/app-drawer-layout/app-drawer-layout";
import "@polymer/app-layout/app-drawer/app-drawer";
import type { AppDrawerElement } from "@polymer/app-layout/app-drawer/app-drawer";
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
import { fireEvent, OPPDomEvent } from "../common/dom/fire_event";
import { listenMediaQuery } from "../common/dom/media_query";
import { toggleAttribute } from "../common/dom/toggle_attribute";
import { showNotificationDrawer } from "../dialogs/notifications/show-notification-drawer";
import type { OpenPeerPower, Route } from "../types";
import "./partial-panel-resolver";

const NON_SWIPABLE_PANELS = ["map"];

declare global {
  // for fire event
  interface OPPDomEvents {
    "opp-toggle-menu": undefined;
    "opp-edit-sidebar": EditSideBarEvent;
    "opp-show-notifications": undefined;
  }
  interface HTMLElementEventMap {
    "opp-edit-sidebar": OPPDomEvent<EditSideBarEvent>;
  }
}

interface EditSideBarEvent {
  editMode: boolean;
}

@customElement("openpeerpower-main")
class OpenPeerPowerMain extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public route?: Route;

  @property({ type: Boolean }) public narrow?: boolean;

  @internalProperty() private _sidebarEditMode = false;

  protected render(): TemplateResult {
    const opp = this.opp;

    if (!opp) {
      return html``;
    }

    const sidebarNarrow = this._sidebarNarrow;

    const disableSwipe =
      this._sidebarEditMode ||
      !sidebarNarrow ||
      NON_SWIPABLE_PANELS.indexOf(opp.panelUrl) !== -1;

    // Style block in render because of the mixin that is not supported
    return html`
      <style>
        app-drawer {
          --app-drawer-content-container: {
            background-color: var(--primary-background-color, #fff);
          }
        }
      </style>
      <app-drawer-layout
        fullbleed
        .forceNarrow=${sidebarNarrow}
        responsive-width="0"
      >
        <app-drawer
          id="drawer"
          align="start"
          slot="drawer"
          .disableSwipe=${disableSwipe}
          .swipeOpen=${!disableSwipe}
          .persistent=${!this.narrow &&
          this.opp.dockedSidebar !== "always_hidden"}
        >
          <ha-sidebar
            .opp=${opp}
            .narrow=${sidebarNarrow}
            .editMode=${this._sidebarEditMode}
            .alwaysExpand=${sidebarNarrow ||
            this.opp.dockedSidebar === "docked"}
          ></ha-sidebar>
        </app-drawer>

        <partial-panel-resolver
          .narrow=${this.narrow}
          .opp=${opp}
          .route=${this.route}
        ></partial-panel-resolver>
      </app-drawer-layout>
    `;
  }

  protected firstUpdated() {
    import("../components/ha-sidebar");

    this.addEventListener(
      "opp-edit-sidebar",
      (ev: OPPDomEvent<EditSideBarEvent>) => {
        this._sidebarEditMode = ev.detail.editMode;

        if (this._sidebarEditMode) {
          if (this._sidebarNarrow) {
            this.drawer.open();
          } else {
            fireEvent(this, "opp-dock-sidebar", {
              dock: "docked",
            });
            setTimeout(() => this.appLayout.resetLayout());
          }
        }
      }
    );

    this.addEventListener("opp-toggle-menu", () => {
      if (this._sidebarEditMode) {
        return;
      }
      if (this._sidebarNarrow) {
        if (this.drawer.opened) {
          this.drawer.close();
        } else {
          this.drawer.open();
        }
      } else {
        fireEvent(this, "opp-dock-sidebar", {
          dock: this.opp.dockedSidebar === "auto" ? "docked" : "auto",
        });
        setTimeout(() => this.appLayout.resetLayout());
      }
    });

    this.addEventListener("opp-show-notifications", () => {
      showNotificationDrawer(this, {
        narrow: this.narrow!,
      });
    });

    listenMediaQuery("(max-width: 870px)", (matches) => {
      this.narrow = matches;
    });
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);

    toggleAttribute(
      this,
      "expanded",
      this.narrow || this.opp.dockedSidebar !== "auto"
    );

    if (changedProps.has("route") && this._sidebarNarrow) {
      this.drawer.close();
    }

    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;

    // Make app-drawer adjust to a potential LTR/RTL change
    if (oldOpp && oldOpp.language !== this.opp!.language) {
      this.drawer._resetPosition();
    }
  }

  private get _sidebarNarrow() {
    return this.narrow || this.opp.dockedSidebar === "always_hidden";
  }

  private get drawer(): AppDrawerElement {
    return this.shadowRoot!.querySelector("app-drawer")!;
  }

  private get appLayout(): AppDrawerLayoutElement {
    return this.shadowRoot!.querySelector("app-drawer-layout")!;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        color: var(--primary-text-color);
        /* remove the grey tap highlights in iOS on the fullscreen touch targets */
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        --app-drawer-width: 56px;
      }
      :host([expanded]) {
        --app-drawer-width: calc(256px + env(safe-area-inset-left));
      }
      partial-panel-resolver,
      ha-sidebar {
        /* allow a light tap highlight on the actual interface elements  */
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "openpeerpower-main": OpenPeerPowerMain;
  }
}
