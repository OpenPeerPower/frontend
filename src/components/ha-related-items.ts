import { OppEntity, UnsubscribeFunc } from "openpeerpower-js-websocket";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../common/dom/fire_event";
import {
  AreaRegistryEntry,
  subscribeAreaRegistry,
} from "../data/area_registry";
import { ConfigEntry, getConfigEntries } from "../data/config_entries";
import {
  DeviceRegistryEntry,
  subscribeDeviceRegistry,
} from "../data/device_registry";
import { SceneEntity } from "../data/scene";
import { findRelated, ItemType, RelatedResult } from "../data/search";
import { SubscribeMixin } from "../mixins/subscribe-mixin";
import { OpenPeerPower } from "../types";
import "./ha-switch";

@customElement("ha-related-items")
export class HaRelatedItems extends SubscribeMixin(LitElement) {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public itemType!: ItemType;

  @property() public itemId!: string;

  @internalProperty() private _entries?: ConfigEntry[];

  @internalProperty() private _devices?: DeviceRegistryEntry[];

  @internalProperty() private _areas?: AreaRegistryEntry[];

  @internalProperty() private _related?: RelatedResult;

  public oppSubscribe(): UnsubscribeFunc[] {
    return [
      subscribeDeviceRegistry(this.opp.connection!, (devices) => {
        this._devices = devices;
      }),
      subscribeAreaRegistry(this.opp.connection!, (areas) => {
        this._areas = areas;
      }),
    ];
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    getConfigEntries(this.opp).then((configEntries) => {
      this._entries = configEntries;
    });
    this.opp.loadBackendTranslation("title");
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (
      (changedProps.has("itemId") || changedProps.has("itemType")) &&
      this.itemId &&
      this.itemType
    ) {
      this._findRelated();
    }
  }

  protected render(): TemplateResult {
    if (!this._related) {
      return html``;
    }
    if (Object.keys(this._related).length === 0) {
      return html`
        ${this.opp.localize("ui.components.related-items.no_related_found")}
      `;
    }
    return html`
      ${this._related.config_entry && this._entries
        ? this._related.config_entry.map((relatedConfigEntryId) => {
            const entry: ConfigEntry | undefined = this._entries!.find(
              (configEntry) => configEntry.entry_id === relatedConfigEntryId
            );
            if (!entry) {
              return "";
            }
            return html`
              <h3>
                ${this.opp.localize(
                  "ui.components.related-items.integration"
                )}:
              </h3>
              <a
                href=${`/config/integrations#config_entry=${relatedConfigEntryId}`}
                @click=${this._navigateAwayClose}
              >
                ${this.opp.localize(`component.${entry.domain}.title`)}:
                ${entry.title}
              </a>
            `;
          })
        : ""}
      ${this._related.device && this._devices
        ? this._related.device.map((relatedDeviceId) => {
            const device: DeviceRegistryEntry | undefined = this._devices!.find(
              (dev) => dev.id === relatedDeviceId
            );
            if (!device) {
              return "";
            }
            return html`
              <h3>
                ${this.opp.localize("ui.components.related-items.device")}:
              </h3>
              <a
                href="/config/devices/device/${relatedDeviceId}"
                @click=${this._navigateAwayClose}
              >
                ${device.name_by_user || device.name}
              </a>
            `;
          })
        : ""}
      ${this._related.area && this._areas
        ? this._related.area.map((relatedAreaId) => {
            const area: AreaRegistryEntry | undefined = this._areas!.find(
              (ar) => ar.area_id === relatedAreaId
            );
            if (!area) {
              return "";
            }
            return html`
              <h3>
                ${this.opp.localize("ui.components.related-items.area")}:
              </h3>
              <a
                href="/config/areas/area/${relatedAreaId}"
                @click=${this._navigateAwayClose}
              >
                ${area.name}
              </a>
            `;
          })
        : ""}
      ${this._related.entity
        ? html`
            <h3>
              ${this.opp.localize("ui.components.related-items.entity")}:
            </h3>
            <ul>
              ${this._related.entity.map((entityId) => {
                const entity: OppEntity | undefined = this.opp.states[
                  entityId
                ];
                if (!entity) {
                  return "";
                }
                return html`
                  <li>
                    <button
                      @click=${this._openMoreInfo}
                      .entityId="${entityId}"
                      class="link"
                    >
                      ${entity.attributes.friendly_name || entityId}
                    </button>
                  </li>
                `;
              })}
            </ul>
          `
        : ""}
      ${this._related.group
        ? html`
            <h3>${this.opp.localize("ui.components.related-items.group")}:</h3>
            <ul>
              ${this._related.group.map((groupId) => {
                const group: OppEntity | undefined = this.opp.states[groupId];
                if (!group) {
                  return "";
                }
                return html`
                  <li>
                    <button
                      class="link"
                      @click=${this._openMoreInfo}
                      .entityId="${groupId}"
                    >
                      ${group.attributes.friendly_name || group.entity_id}
                    </button>
                  </li>
                `;
              })}
            </ul>
          `
        : ""}
      ${this._related.scene
        ? html`
            <h3>${this.opp.localize("ui.components.related-items.scene")}:</h3>
            <ul>
              ${this._related.scene.map((sceneId) => {
                const scene: SceneEntity | undefined = this.opp.states[
                  sceneId
                ];
                if (!scene) {
                  return "";
                }
                return html`
                  <li>
                    <button
                      class="link"
                      @click=${this._openMoreInfo}
                      .entityId="${sceneId}"
                    >
                      ${scene.attributes.friendly_name || scene.entity_id}
                    </button>
                  </li>
                `;
              })}
            </ul>
          `
        : ""}
      ${this._related.automation
        ? html`
            <h3>
              ${this.opp.localize("ui.components.related-items.automation")}:
            </h3>
            <ul>
              ${this._related.automation.map((automationId) => {
                const automation: OppEntity | undefined = this.opp.states[
                  automationId
                ];
                if (!automation) {
                  return "";
                }
                return html`
                  <li>
                    <button
                      class="link"
                      @click=${this._openMoreInfo}
                      .entityId="${automationId}"
                    >
                      ${automation.attributes.friendly_name ||
                      automation.entity_id}
                    </button>
                  </li>
                `;
              })}
            </ul>
          `
        : ""}
      ${this._related.script
        ? html`
            <h3>
              ${this.opp.localize("ui.components.related-items.script")}:
            </h3>
            <ul>
              ${this._related.script.map((scriptId) => {
                const script: OppEntity | undefined = this.opp.states[
                  scriptId
                ];
                if (!script) {
                  return "";
                }
                return html`
                  <li>
                    <button
                      class="link"
                      @click=${this._openMoreInfo}
                      .entityId="${scriptId}"
                    >
                      ${script.attributes.friendly_name || script.entity_id}
                    </button>
                  </li>
                `;
              })}
            </ul>
          `
        : ""}
    `;
  }

  private async _navigateAwayClose() {
    // allow new page to open before closing dialog
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent(this, "close-dialog");
  }

  private async _findRelated() {
    this._related = await findRelated(this.opp, this.itemType, this.itemId);
    await this.updateComplete;
    fireEvent(this, "iron-resize");
  }

  private _openMoreInfo(ev: CustomEvent) {
    const entityId = (ev.target as any).entityId;
    fireEvent(this, "opp-more-info", { entityId });
  }

  static get styles(): CSSResult {
    return css`
      a {
        color: var(--primary-color);
      }
      button.link {
        color: var(--primary-color);
        text-align: left;
        cursor: pointer;
        background: none;
        border-width: initial;
        border-style: none;
        border-color: initial;
        border-image: initial;
        padding: 0px;
        font: inherit;
        text-decoration: underline;
      }
      h3 {
        font-family: var(--paper-font-title_-_font-family);
        -webkit-font-smoothing: var(
          --paper-font-title_-_-webkit-font-smoothing
        );
        font-size: var(--paper-font-title_-_font-size);
        font-weight: var(--paper-font-headline-_font-weight);
        letter-spacing: var(--paper-font-title_-_letter-spacing);
        line-height: var(--paper-font-title_-_line-height);
        opacity: var(--dark-primary-opacity);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-related-items": HaRelatedItems;
  }
}
