import { Collection, UnsubscribeFunc } from "openpeerpower-js-websocket";
import { LitElement, PropertyValues } from "lit";
import { property, state } from "lit/decorators";
import { atLeastVersion } from "../../src/common/config/version";
import { computeLocalize } from "../../src/common/translations/localize";
import { fetchOppioAddonsInfo } from "../../src/data/oppio/addon";
import { OppioResponse } from "../../src/data/oppio/common";
import {
  fetchOppioOppOsInfo,
  fetchOppioHostInfo,
} from "../../src/data/oppio/host";
import { fetchNetworkInfo } from "../../src/data/oppio/network";
import { fetchOppioResolution } from "../../src/data/oppio/resolution";
import {
  fetchOppioOpenPeerPowerInfo,
  fetchOppioInfo,
  fetchOppioSupervisorInfo,
} from "../../src/data/oppio/supervisor";
import { fetchSupervisorStore } from "../../src/data/supervisor/store";
import {
  getSupervisorEventCollection,
  Supervisor,
  SupervisorObject,
  supervisorCollection,
} from "../../src/data/supervisor/supervisor";
import { ProvideOppLitMixin } from "../../src/mixins/provide-opp-lit-mixin";
import { urlSyncMixin } from "../../src/state/url-sync-mixin";
import { OpenPeerPower } from "../../src/types";
import { getTranslation } from "../../src/util/common-translation";

declare global {
  interface OPPDomEvents {
    "supervisor-update": Partial<Supervisor>;
    "supervisor-collection-refresh": { collection: SupervisorObject };
  }
}

export class SupervisorBaseElement extends urlSyncMixin(
  ProvideOppLitMixin(LitElement)
) {
  @property({ attribute: false }) public supervisor: Partial<Supervisor> = {
    localize: () => "",
  };

  @state() private _unsubs: Record<string, UnsubscribeFunc> = {};

  @state() private _collections: Record<string, Collection<unknown>> = {};

  @state() private _language = "en";

  public connectedCallback(): void {
    super.connectedCallback();
    this._initializeLocalize();
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    Object.keys(this._unsubs).forEach((unsub) => {
      this._unsubs[unsub]();
    });
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has("opp")) {
      const oldOpp = changedProperties.get("opp") as
        | OpenPeerPower
        | undefined;
      if (
        oldOpp !== undefined &&
        oldOpp.language !== undefined &&
        oldOpp.language !== this.opp.language
      ) {
        this._language = this.opp.language;
      }
    }

    if (changedProperties.has("_language")) {
      if (changedProperties.get("_language") !== this._language) {
        this._initializeLocalize();
      }
    }

    if (changedProperties.has("_collections")) {
      if (this._collections) {
        const unsubs = Object.keys(this._unsubs);
        for (const collection of Object.keys(this._collections)) {
          if (!unsubs.includes(collection)) {
            this._unsubs[collection] = this._collections[collection].subscribe(
              (data) => this._updateSupervisor({ [collection]: data })
            );
          }
        }
      }
    }
  }

  protected _updateSupervisor(obj: Partial<Supervisor>): void {
    this.supervisor = { ...this.supervisor, ...obj };
  }

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);
    if (
      this._language !== this.opp.language &&
      this.opp.language !== undefined
    ) {
      this._language = this.opp.language;
    }
    this._initializeLocalize();
    this._initSupervisor();
  }

  private async _initializeLocalize() {
    const { language, data } = await getTranslation(
      null,
      this._language,
      "/api/oppio/app/static/translations"
    );

    this.supervisor = {
      ...this.supervisor,
      localize: await computeLocalize(this.constructor.prototype, language, {
        [language]: data,
      }),
    };
  }

  private async _handleSupervisorStoreRefreshEvent(ev) {
    const collection = ev.detail.collection;
    if (atLeastVersion(this.opp.config.version, 2021, 2, 4)) {
      this._collections[collection].refresh();
      return;
    }

    const response = await this.opp.callApi<OppioResponse<any>>(
      "GET",
      `oppio${supervisorCollection[collection]}`
    );
    this._updateSupervisor({ [collection]: response.data });
  }

  private async _initSupervisor(): Promise<void> {
    this.addEventListener(
      "supervisor-collection-refresh",
      this._handleSupervisorStoreRefreshEvent
    );

    if (atLeastVersion(this.opp.config.version, 2021, 2, 4)) {
      Object.keys(supervisorCollection).forEach((collection) => {
        if (collection in this._collections) {
          this._collections[collection].refresh();
        } else {
          this._collections[collection] = getSupervisorEventCollection(
            this.opp.connection,
            collection,
            supervisorCollection[collection]
          );
        }
      });

      Object.keys(this._collections).forEach((collection) => {
        if (
          this.supervisor === undefined ||
          this.supervisor[collection] === undefined
        ) {
          this._updateSupervisor({
            [collection]: this._collections[collection].state,
          });
        }
      });
    } else {
      const [
        addon,
        supervisor,
        host,
        core,
        info,
        os,
        network,
        resolution,
        store,
      ] = await Promise.all([
        fetchOppioAddonsInfo(this.opp),
        fetchOppioSupervisorInfo(this.opp),
        fetchOppioHostInfo(this.opp),
        fetchOppioOpenPeerPowerInfo(this.opp),
        fetchOppioInfo(this.opp),
        fetchOppioOppOsInfo(this.opp),
        fetchNetworkInfo(this.opp),
        fetchOppioResolution(this.opp),
        fetchSupervisorStore(this.opp),
      ]);

      this._updateSupervisor({
        addon,
        supervisor,
        host,
        core,
        info,
        os,
        network,
        resolution,
        store,
      });

      this.addEventListener("supervisor-update", (ev) =>
        this._updateSupervisor(ev.detail)
      );
    }
  }
}
