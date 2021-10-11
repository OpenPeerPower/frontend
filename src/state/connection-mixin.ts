import {
  Auth,
  callService,
  Connection,
  ERR_INVALID_AUTH,
  OppConfig,
  subscribeConfig,
  subscribeEntities,
  subscribeServices,
} from "openpeerpower-js-websocket";
import { fireEvent } from "../common/dom/fire_event";
import { broadcastConnectionStatus } from "../data/connection-status";
import { subscribeFrontendUserData } from "../data/frontend";
import { forwardHaptic } from "../data/haptics";
import { DEFAULT_PANEL } from "../data/panel";
import { NumberFormat } from "../data/translation";
import { subscribePanels } from "../data/ws-panels";
import { translationMetadata } from "../resources/translations-metadata";
import { Constructor, ServiceCallResponse } from "../types";
import { fetchWithAuth } from "../util/fetch-with-auth";
import { getState } from "../util/op-pref-storage";
import oppCallApi from "../util/opp-call-api";
import { getLocalLanguage } from "../util/opp-translation";
import { OppBaseEl } from "./opp-base-mixin";

export const connectionMixin = <T extends Constructor<OppBaseEl>>(
  superClass: T
) =>
  class extends superClass {
    protected initializeOpp(auth: Auth, conn: Connection) {
      const language = getLocalLanguage();

      this.opp = {
        auth,
        connection: conn,
        connected: true,
        states: null as any,
        config: null as any,
        themes: null as any,
        panels: null as any,
        services: null as any,
        user: null as any,
        panelUrl: (this as any)._panelUrl,
        defaultPanel: DEFAULT_PANEL,
        language,
        selectedLanguage: null,
        locale: {
          language,
          number_format: NumberFormat.language,
        },
        resources: null as any,
        localize: () => "",

        translationMetadata,
        dockedSidebar: "docked",
        vibrate: true,
        suspendWhenHidden: true,
        enableShortcuts: true,
        moreInfoEntityId: null,
        oppUrl: (path = "") => new URL(path, auth.data.oppUrl).toString(),
        callService: async (domain, service, serviceData = {}, target) => {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log(
              "Calling service",
              domain,
              service,
              serviceData,
              target
            );
          }
          try {
            return (await callService(
              conn,
              domain,
              service,
              serviceData,
              target
            )) as Promise<ServiceCallResponse>;
          } catch (err) {
            if (__DEV__) {
              // eslint-disable-next-line no-console
              console.error(
                "Error calling service",
                domain,
                service,
                serviceData,
                target,
                err
              );
            }
            forwardHaptic("failure");
            const message =
              (this as any).opp.localize(
                "ui.notification_toast.service_call_failed",
                "service",
                `${domain}/${service}`
              ) + ` ${err.message}`;
            fireEvent(this as any, "opp-notification", { message });
            throw err;
          }
        },
        callApi: async (method, path, parameters, headers) =>
          oppCallApi(auth, method, path, parameters, headers),
        fetchWithAuth: (
          path: string,
          init: Parameters<typeof fetchWithAuth>[2]
        ) => fetchWithAuth(auth, `${auth.data.oppUrl}${path}`, init),
        // For messages that do not get a response
        sendWS: (msg) => {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log("Sending", msg);
          }
          conn.sendMessage(msg);
        },
        // For messages that expect a response
        callWS: <R>(msg) => {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log("Sending", msg);
          }

          const resp = conn.sendMessagePromise<R>(msg);

          if (__DEV__) {
            resp.then(
              // eslint-disable-next-line no-console
              (result) => console.log("Received", result),
              // eslint-disable-next-line no-console
              (err) => console.error("Error", err)
            );
          }
          return resp;
        },
        loadBackendTranslation: (category, integration?, configFlow?) =>
          // @ts-ignore
          this._loadOppTranslations(
            this.opp?.language,
            category,
            integration,
            configFlow
          ),
        ...getState(),
        ...this._pendingOpp,
      };

      this.oppConnected();
    }

    protected oppConnected() {
      super.oppConnected();

      const conn = this.opp!.connection;

      broadcastConnectionStatus("connected");

      conn.addEventListener("ready", () => this.oppReconnected());
      conn.addEventListener("disconnected", () => this.oppDisconnected());
      // If we reconnect after losing connection and auth is no longer valid.
      conn.addEventListener("reconnect-error", (_conn, err) => {
        if (err === ERR_INVALID_AUTH) {
          broadcastConnectionStatus("auth-invalid");
          location.reload();
        }
      });

      subscribeEntities(conn, (states) => this._updateOpp({ states }));
      subscribeConfig(conn, (config) => this._updateOpp({ config }));
      subscribeServices(conn, (services) => this._updateOpp({ services }));
      subscribePanels(conn, (panels) => this._updateOpp({ panels }));
      subscribeFrontendUserData(conn, "core", (userData) =>
        this._updateOpp({ userData })
      );
    }

    protected oppReconnected() {
      super.oppReconnected();

      this._updateOpp({ connected: true });
      broadcastConnectionStatus("connected");

      // on reconnect always fetch config as we might miss an update while we were disconnected
      // @ts-ignore
      this.opp!.callWS({ type: "get_config" }).then((config: OppConfig) => {
        this._updateOpp({ config });
      });
    }

    protected oppDisconnected() {
      super.oppDisconnected();
      this._updateOpp({ connected: false });
      broadcastConnectionStatus("disconnected");
    }
  };
