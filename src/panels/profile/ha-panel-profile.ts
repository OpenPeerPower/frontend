import "@material/mwc-button";
import "@polymer/app-layout/app-header/app-header";
import "@polymer/app-layout/app-toolbar/app-toolbar";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-item/paper-item-body";
import { UnsubscribeFunc } from "openpeerpower-js-websocket";
import {
  css,
  CSSResultArray,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../common/dom/fire_event";
import "../../components/ha-card";
import "../../components/ha-menu-button";
import { isExternal } from "../../data/external";
import {
  CoreFrontendUserData,
  getOptimisticFrontendUserDataCollection,
} from "../../data/frontend";
import { RefreshToken } from "../../data/refresh_token";
import { showConfirmationDialog } from "../../dialogs/generic/show-dialog-box";
import "../../layouts/ha-app-layout";
import { haStyle } from "../../resources/styles";
import { OpenPeerPower } from "../../types";
import "./ha-advanced-mode-row";
import "./ha-change-password-card";
import "./ha-enable-shortcuts-row";
import "./ha-force-narrow-row";
import "./ha-long-lived-access-tokens-card";
import "./ha-mfa-modules-card";
import "./ha-pick-dashboard-row";
import "./ha-pick-language-row";
import "./ha-pick-number-format-row";
import "./ha-pick-theme-row";
import "./ha-push-notifications-row";
import "./ha-refresh-tokens-card";
import "./ha-set-suspend-row";
import "./ha-set-vibrate-row";

class HaPanelProfile extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ type: Boolean }) public narrow!: boolean;

  @internalProperty() private _refreshTokens?: RefreshToken[];

  @internalProperty() private _coreUserData?: CoreFrontendUserData | null;

  private _unsubCoreData?: UnsubscribeFunc;

  public connectedCallback() {
    super.connectedCallback();
    this._refreshRefreshTokens();
    this._unsubCoreData = getOptimisticFrontendUserDataCollection(
      this.opp.connection,
      "core"
    ).subscribe((coreUserData) => {
      this._coreUserData = coreUserData;
    });
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubCoreData) {
      this._unsubCoreData();
      this._unsubCoreData = undefined;
    }
  }

  protected render(): TemplateResult {
    return html`
      <ha-app-layout>
        <app-header slot="header" fixed>
          <app-toolbar>
            <ha-menu-button
              .opp=${this.opp}
              .narrow=${this.narrow}
            ></ha-menu-button>
            <div main-title>${this.opp.localize("panel.profile")}</div>
          </app-toolbar>
        </app-header>

        <div class="content">
          <ha-card .header=${this.opp.user!.name}>
            <div class="card-content">
              ${this.opp.localize(
                "ui.panel.profile.current_user",
                "fullName",
                this.opp.user!.name
              )}
              ${this.opp.user!.is_owner
                ? this.opp.localize("ui.panel.profile.is_owner")
                : ""}
            </div>

            <ha-pick-language-row
              .narrow=${this.narrow}
              .opp=${this.opp}
            ></ha-pick-language-row>
            <ha-pick-number-format-row
              .narrow=${this.narrow}
              .opp=${this.opp}
            ></ha-pick-number-format-row>
            <ha-pick-theme-row
              .narrow=${this.narrow}
              .opp=${this.opp}
            ></ha-pick-theme-row>
            <ha-pick-dashboard-row
              .narrow=${this.narrow}
              .opp=${this.opp}
            ></ha-pick-dashboard-row>
            <ha-settings-row .narrow=${this.narrow}>
              <span slot="heading">
                ${this.opp.localize(
                  "ui.panel.profile.customize_sidebar.header"
                )}
              </span>
              <span slot="description">
                ${this.opp.localize(
                  "ui.panel.profile.customize_sidebar.description"
                )}
              </span>
              <mwc-button @click=${this._customizeSidebar}>
                ${this.opp.localize(
                  "ui.panel.profile.customize_sidebar.button"
                )}
              </mwc-button>
            </ha-settings-row>
            ${this.opp.dockedSidebar !== "auto" || !this.narrow
              ? html`
                  <ha-force-narrow-row
                    .narrow=${this.narrow}
                    .opp=${this.opp}
                  ></ha-force-narrow-row>
                `
              : ""}
            ${"vibrate" in navigator
              ? html`
                  <ha-set-vibrate-row
                    .narrow=${this.narrow}
                    .opp=${this.opp}
                  ></ha-set-vibrate-row>
                `
              : ""}
            ${!isExternal
              ? html`
                  <ha-push-notifications-row
                    .narrow=${this.narrow}
                    .opp=${this.opp}
                  ></ha-push-notifications-row>
                `
              : ""}
            ${this.opp.user!.is_admin
              ? html`
                  <ha-advanced-mode-row
                    .opp=${this.opp}
                    .narrow=${this.narrow}
                    .coreUserData=${this._coreUserData}
                  ></ha-advanced-mode-row>
                `
              : ""}
            <ha-set-suspend-row
              .narrow=${this.narrow}
              .opp=${this.opp}
            ></ha-set-suspend-row>
            <ha-enable-shortcuts-row
              .narrow=${this.narrow}
              .opp=${this.opp}
            ></ha-enable-shortcuts-row>
            <div class="card-actions">
              <mwc-button class="warning" @click=${this._handleLogOut}>
                ${this.opp.localize("ui.panel.profile.logout")}
              </mwc-button>
            </div>
          </ha-card>

          ${this.opp.user!.credentials.some(
            (cred) => cred.auth_provider_type === "openpeerpower"
          )
            ? html`
                <ha-change-password-card
                  .opp=${this.opp}
                ></ha-change-password-card>
              `
            : ""}

          <ha-mfa-modules-card
            .opp=${this.opp}
            .mfaModules=${this.opp.user!.mfa_modules}
          ></ha-mfa-modules-card>

          <ha-refresh-tokens-card
            .opp=${this.opp}
            .refreshTokens=${this._refreshTokens}
            @opp-refresh-tokens=${this._refreshRefreshTokens}
          ></ha-refresh-tokens-card>

          <ha-long-lived-access-tokens-card
            .opp=${this.opp}
            .refreshTokens=${this._refreshTokens}
            @opp-refresh-tokens=${this._refreshRefreshTokens}
          ></ha-long-lived-access-tokens-card>
        </div>
      </ha-app-layout>
    `;
  }

  private _customizeSidebar() {
    fireEvent(this, "opp-edit-sidebar", { editMode: true });
  }

  private async _refreshRefreshTokens() {
    this._refreshTokens = await this.opp.callWS({
      type: "auth/refresh_tokens",
    });
  }

  private _handleLogOut() {
    showConfirmationDialog(this, {
      title: this.opp.localize("ui.panel.profile.logout_title"),
      text: this.opp.localize("ui.panel.profile.logout_text"),
      confirmText: this.opp.localize("ui.panel.profile.logout"),
      confirm: () => fireEvent(this, "opp-logout"),
    });
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        :host {
          -ms-user-select: initial;
          -webkit-user-select: initial;
          -moz-user-select: initial;
        }

        .content {
          display: block;
          max-width: 600px;
          margin: 0 auto;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .content > * {
          display: block;
          margin: 24px 0;
        }

        .promo-advanced {
          text-align: center;
          color: var(--secondary-text-color);
        }
      `,
    ];
  }
}

customElements.define("ha-panel-profile", HaPanelProfile);
