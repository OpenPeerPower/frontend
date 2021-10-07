import "@polymer/paper-item/paper-item";
import "@polymer/paper-item/paper-item-body";
import { html, LitElement } from "lit";
import { property } from "lit/decorators";
import { fireEvent } from "../common/dom/fire_event";
import "../components/op-icon-next";
import { AuthProvider } from "../data/auth";
import { litLocalizeLiteMixin } from "../mixins/lit-localize-lite-mixin";

declare global {
  interface OPPDomEvents {
    "pick-auth-provider": AuthProvider;
  }
}

class HaPickAuthProvider extends litLocalizeLiteMixin(LitElement) {
  @property() public authProviders: AuthProvider[] = [];

  protected render() {
    return html`
      <style>
        paper-item {
          cursor: pointer;
        }
        p {
          margin-top: 0;
        }
      </style>
      <p>${this.localize("ui.panel.page-authorize.pick_auth_provider")}:</p>
      ${this.authProviders.map(
        (provider) => html`
          <paper-item .auth_provider=${provider} @click=${this._handlePick}>
            <paper-item-body>${provider.name}</paper-item-body>
            <op-icon-next></op-icon-next>
          </paper-item>
        `
      )}
    `;
  }

  private _handlePick(ev) {
    fireEvent(this, "pick-auth-provider", ev.currentTarget.auth_provider);
  }
}
customElements.define("ha-pick-auth-provider", HaPickAuthProvider);
