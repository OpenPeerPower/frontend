import { askWrite } from "../common/auth/token_storage";
import { subscribeUser, userCollection } from "../data/ws-user";
import { Constructor } from "../types";
import { clearState } from "../util/op-pref-storage";
import { OppBaseEl } from "./opp-base-mixin";

declare global {
  // for fire event
  interface OPPDomEvents {
    "opp-refresh-current-user": undefined;
  }
}

export default <T extends Constructor<OppBaseEl>>(superClass: T) =>
  class extends superClass {
    protected firstUpdated(changedProps) {
      super.firstUpdated(changedProps);
      this.addEventListener("opp-logout", () => this._handleLogout());
      this.addEventListener("opp-refresh-current-user", () => {
        userCollection(this.opp!.connection).refresh();
      });
    }

    protected oppConnected() {
      super.oppConnected();
      subscribeUser(this.opp!.connection, (user) =>
        this._updateOpp({ user })
      );

      if (askWrite()) {
        this.updateComplete
          .then(() => import("../dialogs/op-store-auth-card"))
          .then(() => {
            const el = document.createElement("op-store-auth-card");
            this.shadowRoot!.appendChild(el);
            this.provideOpp(el);
          });
      }
    }

    private async _handleLogout() {
      try {
        await this.opp!.auth.revoke();
        this.opp!.connection.close();
        clearState();
        document.location.href = "/";
      } catch (err) {
        // eslint-disable-next-line
        console.error(err);
        alert("Log out failed");
      }
    }
  };
