import {
  STATE_NOT_RUNNING,
  STATE_RUNNING,
  STATE_STARTING,
  UnsubscribeFunc,
} from "openpeerpower-js-websocket";
import { Constructor } from "../types";
import { showToast } from "../util/toast";
import { OppBaseEl } from "./opp-base-mixin";
import { domainToName } from "../data/integration";
import {
  subscribeBootstrapIntegrations,
  BootstrapIntegrationsTimings,
} from "../data/bootstrap_integrations";

export default <T extends Constructor<OppBaseEl>>(superClass: T) =>
  class extends superClass {
    private _subscribedBootstrapIntegrations?: Promise<UnsubscribeFunc>;

    protected firstUpdated(changedProps) {
      super.firstUpdated(changedProps);
      // Need to load in advance because when disconnected, can't dynamically load code.
      import("../managers/notification-manager");
    }

    updated(changedProperties) {
      super.updated(changedProperties);
      const oldOpp = changedProperties.get("opp");
      if (
        !changedProperties.has("opp") ||
        !this.opp!.config ||
        oldOpp?.config?.state === this.opp!.config.state
      ) {
        return;
      }
      if (this.opp!.config.state === STATE_NOT_RUNNING) {
        showToast(this, {
          message:
            this.opp!.localize("ui.notification_toast.starting") ||
            "Open Peer Power is starting, not everything will be available until it is finished.",
          duration: 0,
          dismissable: false,
          action: {
            text:
              this.opp!.localize("ui.notification_toast.dismiss") || "Dismiss",
            action: () => {
              this._unsubscribeBootstrapIntergrations();
            },
          },
        });
        this._subscribeBootstrapIntergrations();
      } else if (
        oldOpp?.config &&
        oldOpp.config.state === STATE_NOT_RUNNING &&
        (this.opp!.config.state === STATE_STARTING ||
          this.opp!.config.state === STATE_RUNNING)
      ) {
        this._unsubscribeBootstrapIntergrations();
        showToast(this, {
          message: this.opp!.localize("ui.notification_toast.started"),
          duration: 5000,
        });
      }
    }

    protected oppReconnected() {
      super.oppReconnected();
      showToast(this, {
        message: "",
        duration: 1,
      });
    }

    protected oppDisconnected() {
      super.oppDisconnected();

      showToast(this, {
        message: this.opp!.localize("ui.notification_toast.connection_lost"),
        duration: 0,
        dismissable: false,
      });
    }

    private _handleMessage(message: BootstrapIntegrationsTimings): void {
      if (this.opp!.config.state !== STATE_NOT_RUNNING) {
        return;
      }

      if (Object.keys(message).length === 0) {
        showToast(this, {
          message:
            this.opp!.localize("ui.notification_toast.wrapping_up_startup") ||
            `Wrapping up startup, not everything will be available until it is finished.`,
          duration: 0,
          dismissable: false,
          action: {
            text:
              this.opp!.localize("ui.notification_toast.dismiss") || "Dismiss",
            action: () => {
              this._unsubscribeBootstrapIntergrations();
            },
          },
        });
        return;
      }

      // Show the integration that has been starting for the longest time
      const integration = Object.entries(message).sort(
        ([, a], [, b]) => b - a
      )[0][0];

      showToast(this, {
        message:
          this.opp!.localize(
            "ui.notification_toast.intergration_starting",
            "integration",
            domainToName(this.opp!.localize, integration)
          ) ||
          `Starting ${integration}, not everything will be available until it is finished.`,
        duration: 0,
        dismissable: false,
        action: {
          text:
            this.opp!.localize("ui.notification_toast.dismiss") || "Dismiss",
          action: () => {
            this._unsubscribeBootstrapIntergrations();
          },
        },
      });
    }

    private _unsubscribeBootstrapIntergrations() {
      if (this._subscribedBootstrapIntegrations) {
        this._subscribedBootstrapIntegrations.then((unsub) => unsub());
        this._subscribedBootstrapIntegrations = undefined;
      }
    }

    private _subscribeBootstrapIntergrations() {
      if (!this.opp) {
        return;
      }
      this._subscribedBootstrapIntegrations = subscribeBootstrapIntegrations(
        this.opp!,
        (message) => {
          this._handleMessage(message);
        }
      );
    }
  };
