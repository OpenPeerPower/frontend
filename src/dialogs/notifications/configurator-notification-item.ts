import "@material/mwc-button";
import { html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import { computeStateDisplay } from "../../common/entity/compute_state_display";
import { domainToName } from "../../data/integration";
import { PersitentNotificationEntity } from "../../data/persistent_notification";
import { OpenPeerPower } from "../../types";
import "./notification-item-template";

@customElement("configurator-notification-item")
export class HuiConfiguratorNotificationItem extends LitElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property() public notification?: PersitentNotificationEntity;

  protected render(): TemplateResult {
    if (!this.opp || !this.notification) {
      return html``;
    }

    return html`
      <notification-item-template>
        <span slot="header">
          ${domainToName(this.opp.localize, "configurator")}
        </span>

        <div>
          ${this.opp.localize(
            "ui.notification_drawer.click_to_configure",
            "entity",
            this.notification.attributes.friendly_name
          )}
        </div>

        <mwc-button slot="actions" @click="${this._handleClick}"
          >${computeStateDisplay(
            this.opp.localize,
            this.notification,
            this.opp.locale
          )}</mwc-button
        >
      </notification-item-template>
    `;
  }

  private _handleClick(): void {
    fireEvent(this, "opp-more-info", {
      entityId: this.notification!.entity_id,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "configurator-notification-item": HuiConfiguratorNotificationItem;
  }
}
