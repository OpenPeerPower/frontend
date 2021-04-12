import {
  createConnection,
  getAuth,
  UnsubscribeFunc,
} from "open-peer-power-js-websocket";
import {
  customElement,
  html,
  internalProperty,
  TemplateResult,
} from "lit-element";
import { CAST_NS } from "../../../../src/cast/const";
import {
  ConnectMessage,
  GetStatusMessage,
  OppMessage,
  ShowDemoMessage,
  ShowLovelaceViewMessage,
} from "../../../../src/cast/receiver_messages";
import { ReceiverStatusMessage } from "../../../../src/cast/sender_messages";
import { atLeastVersion } from "../../../../src/common/config/version";
import { isNavigationClick } from "../../../../src/common/dom/is-navigation-click";
import {
  fetchResources,
  getLegacyLovelaceCollection,
  getLovelaceCollection,
  LegacyLovelaceConfig,
  LovelaceConfig,
} from "../../../../src/data/lovelace";
import { loadLovelaceResources } from "../../../../src/panels/lovelace/common/load-resources";
import { OppElement } from "../../../../src/state/opp-element";
import { castContext } from "../cast_context";
import "./hc-launch-screen";

let resourcesLoaded = false;

@customElement("hc-main")
export class HcMain extends OppElement {
  @internalProperty() private _showDemo = false;

  @internalProperty() private _lovelaceConfig?: LovelaceConfig;

  @internalProperty() private _lovelacePath: string | number | null = null;

  @internalProperty() private _error?: string;

  private _unsubLovelace?: UnsubscribeFunc;

  private _urlPath?: string | null;

  public processIncomingMessage(msg: OppMessage) {
    if (msg.type === "connect") {
      this._handleConnectMessage(msg);
    } else if (msg.type === "show_lovelace_view") {
      this._handleShowLovelaceMessage(msg);
    } else if (msg.type === "get_status") {
      this._handleGetStatusMessage(msg);
    } else if (msg.type === "show_demo") {
      this._handleShowDemo(msg);
    } else {
      // eslint-disable-next-line no-console
      console.warn("unknown msg type", msg);
    }
  }

  protected render(): TemplateResult {
    if (this._showDemo) {
      return html` <hc-demo .lovelacePath=${this._lovelacePath}></hc-demo> `;
    }

    if (
      !this._lovelaceConfig ||
      this._lovelacePath === null ||
      // Guard against part of OP not being loaded yet.
      (this.opp &&
        (!this.opp.states || !this.opp.config || !this.opp.services))
    ) {
      return html`
        <hc-launch-screen
          .opp=${this.opp}
          .error=${this._error}
        ></hc-launch-screen>
      `;
    }
    return html`
      <hc-lovelace
        .opp=${this.opp}
        .lovelaceConfig=${this._lovelaceConfig}
        .viewPath=${this._lovelacePath}
        .urlPath=${this._urlPath}
        @config-refresh=${this._generateLovelaceConfig}
      ></hc-lovelace>
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    import("../second-load");
    window.addEventListener("location-changed", () => {
      const panelPath = `/${this._urlPath || "lovelace"}/`;
      if (location.pathname.startsWith(panelPath)) {
        this._lovelacePath = location.pathname.substr(panelPath.length);
        this._sendStatus();
      }
    });
    document.body.addEventListener("click", (ev) => {
      const panelPath = `/${this._urlPath || "lovelace"}/`;
      const href = isNavigationClick(ev);
      if (href && href.startsWith(panelPath)) {
        this._lovelacePath = href.substr(panelPath.length);
        this._sendStatus();
      }
    });
  }

  private _sendStatus(senderId?: string) {
    const status: ReceiverStatusMessage = {
      type: "receiver_status",
      connected: !!this.opp,
      showDemo: this._showDemo,
    };

    if (this.opp) {
      status.oppUrl = this.opp.auth.data.oppUrl;
      status.lovelacePath = this._lovelacePath!;
      status.urlPath = this._urlPath;
    }

    if (senderId) {
      this.sendMessage(senderId, status);
    } else {
      for (const sender of castContext.getSenders()) {
        this.sendMessage(sender.id, status);
      }
    }
  }

  private async _handleGetStatusMessage(msg: GetStatusMessage) {
    this._sendStatus(msg.senderId!);
  }

  private async _handleConnectMessage(msg: ConnectMessage) {
    let auth;
    try {
      auth = await getAuth({
        loadTokens: async () => ({
          oppUrl: msg.oppUrl,
          clientId: msg.clientId,
          refresh_token: msg.refreshToken,
          access_token: "",
          expires: 0,
          expires_in: 0,
        }),
      });
    } catch (err) {
      this._error = this._getErrorMessage(err);
      return;
    }
    let connection;
    try {
      connection = await createConnection({ auth });
    } catch (err) {
      this._error = this._getErrorMessage(err);
      return;
    }
    if (this.opp) {
      this.opp.connection.close();
    }
    this.initializeOpp(auth, connection);
    this._error = undefined;
    this._sendStatus();
  }

  private async _handleShowLovelaceMessage(msg: ShowLovelaceViewMessage) {
    // We should not get this command before we are connected.
    // Means a client got out of sync. Let's send status to them.
    if (!this.opp) {
      this._sendStatus(msg.senderId!);
      this._error = "Cannot show Lovelace because we're not connected.";
      return;
    }
    if (msg.urlPath === "lovelace") {
      msg.urlPath = null;
    }
    if (!this._unsubLovelace || this._urlPath !== msg.urlPath) {
      this._urlPath = msg.urlPath;
      if (this._unsubLovelace) {
        this._unsubLovelace();
      }
      const llColl = atLeastVersion(this.opp.connection.haVersion, 0, 107)
        ? getLovelaceCollection(this.opp!.connection, msg.urlPath)
        : getLegacyLovelaceCollection(this.opp!.connection);
      // We first do a single refresh because we need to check if there is LL
      // configuration.
      try {
        await llColl.refresh();
        this._unsubLovelace = llColl.subscribe((lovelaceConfig) =>
          this._handleNewLovelaceConfig(lovelaceConfig)
        );
      } catch (err) {
        // eslint-disable-next-line
        console.log("Error fetching Lovelace configuration", err, msg);
        // Generate a Lovelace config.
        this._unsubLovelace = () => undefined;
        await this._generateLovelaceConfig();
      }
    }
    if (!resourcesLoaded) {
      resourcesLoaded = true;
      const resources = atLeastVersion(this.opp.connection.haVersion, 0, 107)
        ? await fetchResources(this.opp!.connection)
        : (this._lovelaceConfig as LegacyLovelaceConfig).resources;
      if (resources) {
        loadLovelaceResources(resources, this.opp!.auth.data.oppUrl);
      }
    }
    this._showDemo = false;
    this._lovelacePath = msg.viewPath;

    this._sendStatus();
  }

  private async _generateLovelaceConfig() {
    const { generateLovelaceConfigFromOpp } = await import(
      "../../../../src/panels/lovelace/common/generate-lovelace-config"
    );
    this._handleNewLovelaceConfig(
      await generateLovelaceConfigFromOpp(this.opp!)
    );
  }

  private _handleNewLovelaceConfig(lovelaceConfig: LovelaceConfig) {
    castContext.setApplicationState(lovelaceConfig.title!);
    this._lovelaceConfig = lovelaceConfig;
  }

  private _handleShowDemo(_msg: ShowDemoMessage) {
    import("./hc-demo").then(() => {
      this._showDemo = true;
      this._lovelacePath = "overview";
      this._sendStatus();
    });
  }

  private _getErrorMessage(error: number): string {
    switch (error) {
      case 1:
        return "Unable to connect to the Open Peer Power websocket API.";
      case 2:
        return "The supplied authentication is invalid.";
      case 3:
        return "The connection to Open Peer Power was lost.";
      case 4:
        return "Missing oppUrl. This is required.";
      case 5:
        return "Open Peer Power needs to be served over https:// to use with Open Peer Power Cast.";
      default:
        return "Unknown Error";
    }
  }

  private sendMessage(senderId: string, response: any) {
    castContext.sendCustomMessage(CAST_NS, senderId, response);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hc-main": HcMain;
  }
}
