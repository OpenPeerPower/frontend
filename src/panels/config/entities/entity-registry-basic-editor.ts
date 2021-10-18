import "@polymer/paper-input/paper-input";
import { UnsubscribeFunc } from "openpeerpower-js-websocket";
import {
  css,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { computeDomain } from "../../../common/entity/compute_domain";
import "../../../components/op-area-picker";
import "../../../components/op-switch";
import type { HaSwitch } from "../../../components/op-switch";
import {
  DeviceRegistryEntry,
  subscribeDeviceRegistry,
} from "../../../data/device_registry";
import {
  EntityRegistryEntryUpdateParams,
  ExtEntityRegistryEntry,
  updateEntityRegistryEntry,
} from "../../../data/entity_registry";
import { showAlertDialog } from "../../../dialogs/generic/show-dialog-box";
import { SubscribeMixin } from "../../../mixins/subscribe-mixin";
import type { PolymerChangedEvent } from "../../../polymer-types";
import type { OpenPeerPower } from "../../../types";

@customElement("op-registry-basic-editor")
export class HaEntityRegistryBasicEditor extends SubscribeMixin(LitElement) {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public entry!: ExtEntityRegistryEntry;

  @internalProperty() private _origEntityId!: string;

  @internalProperty() private _entityId!: string;

  @internalProperty() private _areaId?: string | null;

  @internalProperty() private _disabledBy!: string | null;

  private _deviceLookup?: Record<string, DeviceRegistryEntry>;

  @internalProperty() private _device?: DeviceRegistryEntry;

  @internalProperty() private _submitting?: boolean;

  public async updateEntry(): Promise<void> {
    this._submitting = true;
    const params: Partial<EntityRegistryEntryUpdateParams> = {
      new_entity_id: this._entityId.trim(),
      area_id: this._areaId || null,
    };
    if (
      this.entry.disabled_by !== this._disabledBy &&
      (this._disabledBy === null || this._disabledBy === "user")
    ) {
      params.disabled_by = this._disabledBy;
    }
    try {
      const result = await updateEntityRegistryEntry(
        this.opp!,
        this._origEntityId,
        params
      );
      if (result.require_restart) {
        showAlertDialog(this, {
          text: this.opp.localize(
            "ui.dialogs.entity_registry.editor.enabled_restart_confirm"
          ),
        });
      }
      if (result.reload_delay) {
        showAlertDialog(this, {
          text: this.opp.localize(
            "ui.dialogs.entity_registry.editor.enabled_delay_confirm",
            "delay",
            result.reload_delay
          ),
        });
      }
    } finally {
      this._submitting = false;
    }
  }

  public oppSubscribe(): UnsubscribeFunc[] {
    return [
      subscribeDeviceRegistry(this.opp.connection!, (devices) => {
        this._deviceLookup = {};
        for (const device of devices) {
          this._deviceLookup[device.id] = device;
        }
        if (!this._device && this.entry.device_id) {
          this._device = this._deviceLookup[this.entry.device_id];
        }
      }),
    ];
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (!changedProperties.has("entry")) {
      return;
    }
    if (this.entry) {
      this._origEntityId = this.entry.entity_id;
      this._entityId = this.entry.entity_id;
      this._disabledBy = this.entry.disabled_by;
      this._areaId = this.entry.area_id;
      this._device =
        this.entry.device_id && this._deviceLookup
          ? this._deviceLookup[this.entry.device_id]
          : undefined;
    }
  }

  protected render(): TemplateResult {
    if (
      !this.opp ||
      !this.entry ||
      this.entry.entity_id !== this._origEntityId
    ) {
      return html``;
    }
    const invalidDomainUpdate =
      computeDomain(this._entityId.trim()) !==
      computeDomain(this.entry.entity_id);

    return html`
      <paper-input
        .value=${this._entityId}
        @value-changed=${this._entityIdChanged}
        .label=${this.opp.localize(
          "ui.dialogs.entity_registry.editor.entity_id"
        )}
        error-message="Domain needs to stay the same"
        .invalid=${invalidDomainUpdate}
        .disabled=${this._submitting}
      ></paper-input>
      <op-area-picker
        .opp=${this.opp}
        .value=${this._areaId}
        .placeholder=${this._device?.area_id}
        @value-changed=${this._areaPicked}
      ></op-area-picker>
      <div class="row">
        <op-switch
          .checked=${!this._disabledBy}
          @change=${this._disabledByChanged}
        >
        </op-switch>
        <div>
          <div>
            ${this.opp.localize(
              "ui.dialogs.entity_registry.editor.enabled_label"
            )}
          </div>
          <div class="secondary">
            ${this._disabledBy && this._disabledBy !== "user"
              ? this.opp.localize(
                  "ui.dialogs.entity_registry.editor.enabled_cause",
                  "cause",
                  this.opp.localize(
                    `config_entry.disabled_by.${this._disabledBy}`
                  )
                )
              : ""}
            ${this.opp.localize(
              "ui.dialogs.entity_registry.editor.enabled_description"
            )}
            <br />${this.opp.localize("ui.dialogs.entity_registry.editor.note")}
          </div>
        </div>
      </div>
    `;
  }

  private _areaPicked(ev: CustomEvent) {
    this._areaId = ev.detail.value;
  }

  private _entityIdChanged(ev: PolymerChangedEvent<string>): void {
    this._entityId = ev.detail.value;
  }

  private _disabledByChanged(ev: Event): void {
    this._disabledBy = (ev.target as HaSwitch).checked ? null : "user";
  }

  static get styles() {
    return css`
      op-switch {
        margin-right: 16px;
      }
      .row {
        margin-top: 8px;
        color: var(--primary-text-color);
        display: flex;
        align-items: center;
      }
      .secondary {
        color: var(--secondary-text-color);
      }
    `;
  }
}
