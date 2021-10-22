import "@material/mwc-button";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-item/paper-item-body";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../common/dom/fire_event";
import "../../components/op-card";
import { showConfirmationDialog } from "../../dialogs/generic/show-dialog-box";
import { OpenPeerPower, MFAModule } from "../../types";
import { showMfaModuleSetupFlowDialog } from "./show-op-mfa-module-setup-flow-dialog";

@customElement("op-mfa-modules-card")
class HaMfaModulesCard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public mfaModules!: MFAModule[];

  protected render(): TemplateResult {
    return html`
      <op-card .header=${this.opp.localize("ui.panel.profile.mfa.header")}>
        ${this.mfaModules.map(
          (module) => html`<paper-item>
            <paper-item-body two-line="">
              <div>${module.name}</div>
              <div secondary>${module.id}</div>
            </paper-item-body>
            ${module.enabled
              ? html`<mwc-button .module=${module} @click=${this._disable}
                  >${this.opp.localize(
                    "ui.panel.profile.mfa.disable"
                  )}</mwc-button
                >`
              : html`<mwc-button .module=${module} @click=${this._enable}
                  >${this.opp.localize(
                    "ui.panel.profile.mfa.enable"
                  )}</mwc-button
                >`}
          </paper-item>`
        )}
      </op-card>
    `;
  }

  static get styles(): CSSResult {
    return css`
      mwc-button {
        margin-right: -0.57em;
      }
    `;
  }

  private _enable(ev) {
    showMfaModuleSetupFlowDialog(this, {
      mfaModuleId: ev.currentTarget.module.id,
      dialogClosedCallback: () => this._refreshCurrentUser(),
    });
  }

  private async _disable(ev) {
    const mfamodule = ev.currentTarget.module;
    if (
      !(await showConfirmationDialog(this, {
        text: this.opp.localize(
          "ui.panel.profile.mfa.confirm_disable",
          "name",
          mfamodule.name
        ),
      }))
    ) {
      return;
    }

    const mfaModuleId = mfamodule.id;

    this.opp
      .callWS({
        type: "auth/depose_mfa",
        mfa_module_id: mfaModuleId,
      })
      .then(() => {
        this._refreshCurrentUser();
      });
  }

  private _refreshCurrentUser() {
    fireEvent(this, "opp-refresh-current-user");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-mfa-modules-card": HaMfaModulesCard;
  }
}
