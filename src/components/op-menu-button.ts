import "@material/mwc-icon-button";
import { mdiMenu } from "@mdi/js";
import { UnsubscribeFunc } from "openpeerpower-js-websocket";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../common/dom/fire_event";
import { computeDomain } from "../common/entity/compute_domain";
import { subscribeNotifications } from "../data/persistent_notification";
import { OpenPeerPower } from "../types";
import "./ha-svg-icon";

@customElement("ha-menu-button")
class HaMenuButton extends LitElement {
  @property({ type: Boolean }) public oppio = false;

  @property() public narrow!: boolean;

  @property({ attribute: false }) public opp!: OpenPeerPower;

  @state() private _hasNotifications = false;

  private _alwaysVisible = false;

  private _attachNotifOnConnect = false;

  private _unsubNotifications?: UnsubscribeFunc;

  public connectedCallback() {
    super.connectedCallback();
    if (this._attachNotifOnConnect) {
      this._attachNotifOnConnect = false;
      this._subscribeNotifications();
    }
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubNotifications) {
      this._attachNotifOnConnect = true;
      this._unsubNotifications();
      this._unsubNotifications = undefined;
    }
  }

  protected render(): TemplateResult {
    const hasNotifications =
      (this.narrow || this.opp.dockedSidebar === "always_hidden") &&
      (this._hasNotifications ||
        Object.keys(this.opp.states).some(
          (entityId) => computeDomain(entityId) === "configurator"
        ));
    return html`
      <mwc-icon-button
        aria-label=${this.opp.localize("ui.sidebar.sidebar_toggle")}
        @click=${this._toggleMenu}
      >
        <ha-svg-icon .path=${mdiMenu}></ha-svg-icon>
      </mwc-icon-button>
      ${hasNotifications ? html` <div class="dot"></div> ` : ""}
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    if (!this.oppio) {
      return;
    }
    // This component is used on Opp.io too, but Opp.io might run the UI
    // on older frontends too, that don't have an always visible menu button
    // in the sidebar.
    this._alwaysVisible =
      (Number((window.parent as any).frontendVersion) || 0) < 20190710;
  }

  protected updated(changedProps) {
    super.updated(changedProps);

    if (!changedProps.has("narrow") && !changedProps.has("opp")) {
      return;
    }

    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
    const oldNarrow =
      changedProps.get("narrow") ||
      (oldOpp && oldOpp.dockedSidebar === "always_hidden");
    const newNarrow =
      this.narrow || this.opp.dockedSidebar === "always_hidden";

    if (oldNarrow === newNarrow) {
      return;
    }

    this.style.display = newNarrow || this._alwaysVisible ? "initial" : "none";

    if (!newNarrow) {
      if (this._unsubNotifications) {
        this._unsubNotifications();
        this._unsubNotifications = undefined;
      }
      return;
    }

    this._subscribeNotifications();
  }

  private _subscribeNotifications() {
    this._unsubNotifications = subscribeNotifications(
      this.opp.connection,
      (notifications) => {
        this._hasNotifications = notifications.length > 0;
      }
    );
  }

  private _toggleMenu(): void {
    fireEvent(this, "opp-toggle-menu");
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        position: relative;
      }
      .dot {
        pointer-events: none;
        position: absolute;
        background-color: var(--accent-color);
        width: 12px;
        height: 12px;
        top: 9px;
        right: 7px;
        border-radius: 50%;
        border: 2px solid var(--app-header-background-color);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-menu-button": HaMenuButton;
  }
}
