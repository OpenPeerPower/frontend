import { OppEntity } from "openpeerpower-js-websocket";
import {
  customElement,
  html,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { PersistentNotification } from "../../data/persistent_notification";
import { OpenPeerPower } from "../../types";
import "./configurator-notification-item";
import "./persistent-notification-item";

@customElement("notification-item")
export class HuiNotificationItem extends LitElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property() public notification?: OppEntity | PersistentNotification;

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.opp || !this.notification || changedProps.has("notification")) {
      return true;
    }

    return false;
  }

  protected render(): TemplateResult {
    if (!this.opp || !this.notification) {
      return html``;
    }

    return "entity_id" in this.notification
      ? html`
          <configurator-notification-item
            .opp=${this.opp}
            .notification="${this.notification}"
          ></configurator-notification-item>
        `
      : html`
          <persistent-notification-item
            .opp=${this.opp}
            .notification="${this.notification}"
          ></persistent-notification-item>
        `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "notification-item": HuiNotificationItem;
  }
}
