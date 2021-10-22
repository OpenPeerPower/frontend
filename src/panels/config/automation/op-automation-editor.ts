import { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
import "@material/mwc-list/mwc-list-item";
import {
  mdiCheck,
  mdiContentDuplicate,
  mdiContentSave,
  mdiDelete,
  mdiDotsVertical,
} from "@mdi/js";
import "@polymer/app-layout/app-header/app-header";
import "@polymer/app-layout/app-toolbar/app-toolbar";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu-light";
import "@polymer/paper-input/paper-textarea";
import {
  css,
  CSSResult,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  query,
  TemplateResult,
} from "lit-element";
import { classMap } from "lit-html/directives/class-map";
import { navigate } from "../../../common/navigate";
import { copyToClipboard } from "../../../common/util/copy-clipboard";
import "../../../components/op-button-menu";
import "../../../components/op-card";
import "../../../components/op-fab";
import "../../../components/op-icon-button";
import "../../../components/op-svg-icon";
import "../../../components/op-yaml-editor";
import type { HaYamlEditor } from "../../../components/op-yaml-editor";
import {
  AutomationConfig,
  AutomationEntity,
  deleteAutomation,
  getAutomationConfig,
  getAutomationEditorInitData,
  showAutomationEditor,
  triggerAutomationActions,
} from "../../../data/automation";
import {
  showAlertDialog,
  showConfirmationDialog,
} from "../../../dialogs/generic/show-dialog-box";
import "../../../layouts/op-app-layout";
import "../../../layouts/opp-tabs-subpage";
import { KeyboardShortcutMixin } from "../../../mixins/keyboard-shortcut-mixin";
import { haStyle } from "../../../resources/styles";
import { OpenPeerPower, Route } from "../../../types";
import { showToast } from "../../../util/toast";
import "../op-config-section";
import { configSections } from "../op-panel-config";
import "./action/op-automation-action";
import { HaDeviceAction } from "./action/types/op-automation-action-device_id";
import "./blueprint-automation-editor";
import "./condition/op-automation-condition";
import "./manual-automation-editor";
import "./trigger/op-automation-trigger";
import { HaDeviceTrigger } from "./trigger/types/op-automation-trigger-device";

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-editor": HaAutomationEditor;
  }
  // for fire event
  interface OPPDomEvents {
    "ui-mode-not-available": Error;
    duplicate: undefined;
  }
}

export class HaAutomationEditor extends KeyboardShortcutMixin(LitElement) {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public automationId!: string;

  @property() public automations!: AutomationEntity[];

  @property() public isWide?: boolean;

  @property() public narrow!: boolean;

  @property() public route!: Route;

  @internalProperty() private _config?: AutomationConfig;

  @internalProperty() private _dirty = false;

  @internalProperty() private _errors?: string;

  @internalProperty() private _entityId?: string;

  @internalProperty() private _mode: "gui" | "yaml" = "gui";

  @query("op-yaml-editor", true) private _editor?: HaYamlEditor;

  protected render(): TemplateResult {
    const stateObj = this._entityId
      ? this.opp.states[this._entityId]
      : undefined;
    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        .backCallback=${() => this._backTapped()}
        .tabs=${configSections.automation}
      >
        <op-button-menu
          corner="BOTTOM_START"
          slot="toolbar-icon"
          @action=${this._handleMenuAction}
          activatable
        >
          <mwc-icon-button
            slot="trigger"
            .title=${this.opp.localize("ui.common.menu")}
            .label=${this.opp.localize("ui.common.overflow_menu")}
            ><op-svg-icon path=${mdiDotsVertical}></op-svg-icon>
          </mwc-icon-button>

          <mwc-list-item
            aria-label=${this.opp.localize(
              "ui.panel.config.automation.editor.edit_ui"
            )}
            graphic="icon"
            ?activated=${this._mode === "gui"}
          >
            ${this.opp.localize("ui.panel.config.automation.editor.edit_ui")}
            ${this._mode === "gui"
              ? html`<op-svg-icon
                  class="selected_menu_item"
                  slot="graphic"
                  .path=${mdiCheck}
                ></op-svg-icon>`
              : ``}
          </mwc-list-item>
          <mwc-list-item
            aria-label=${this.opp.localize(
              "ui.panel.config.automation.editor.edit_yaml"
            )}
            graphic="icon"
            ?activated=${this._mode === "yaml"}
          >
            ${this.opp.localize("ui.panel.config.automation.editor.edit_yaml")}
            ${this._mode === "yaml"
              ? html`<op-svg-icon
                  class="selected_menu_item"
                  slot="graphic"
                  .path=${mdiCheck}
                ></op-svg-icon>`
              : ``}
          </mwc-list-item>

          <li divider role="separator"></li>

          <mwc-list-item
            .disabled=${!this.automationId}
            aria-label=${this.opp.localize(
              "ui.panel.config.automation.picker.duplicate_automation"
            )}
            graphic="icon"
          >
            ${this.opp.localize(
              "ui.panel.config.automation.picker.duplicate_automation"
            )}
            <op-svg-icon
              slot="graphic"
              .path=${mdiContentDuplicate}
            ></op-svg-icon>
          </mwc-list-item>

          <mwc-list-item
            .disabled=${!this.automationId}
            aria-label=${this.opp.localize(
              "ui.panel.config.automation.picker.delete_automation"
            )}
            class=${classMap({ warning: this.automationId })}
            graphic="icon"
          >
            ${this.opp.localize(
              "ui.panel.config.automation.picker.delete_automation"
            )}
            <op-svg-icon
              class=${classMap({ warning: this.automationId })}
              slot="graphic"
              .path=${mdiDelete}
            >
            </op-svg-icon>
          </mwc-list-item>
        </op-button-menu>

        ${this._config
          ? html`
              ${this.narrow
                ? html` <span slot="header">${this._config?.alias}</span> `
                : ""}
              <div
                class="content ${classMap({
                  "yaml-mode": this._mode === "yaml",
                })}"
              >
                ${this._errors
                  ? html` <div class="errors">${this._errors}</div> `
                  : ""}
                ${this._mode === "gui"
                  ? html`
                      ${"use_blueprint" in this._config
                        ? html`<blueprint-automation-editor
                            .opp=${this.opp}
                            .narrow=${this.narrow}
                            .isWide=${this.isWide}
                            .stateObj=${stateObj}
                            .config=${this._config}
                            @value-changed=${this._valueChanged}
                          ></blueprint-automation-editor>`
                        : html`<manual-automation-editor
                            .opp=${this.opp}
                            .narrow=${this.narrow}
                            .isWide=${this.isWide}
                            .stateObj=${stateObj}
                            .config=${this._config}
                            @value-changed=${this._valueChanged}
                          ></manual-automation-editor>`}
                    `
                  : this._mode === "yaml"
                  ? html`
                      ${!this.narrow
                        ? html`
                            <op-card
                              ><div class="card-header">
                                ${this._config.alias}
                              </div>
                              ${stateObj
                                ? html`
                                    <div
                                      class="card-actions layout horizontal justified center"
                                    >
                                      <op-entity-toggle
                                        .opp=${this.opp}
                                        .stateObj=${stateObj}
                                        .label=${this.opp.localize(
                                          "ui.panel.config.automation.editor.enable_disable"
                                        )}
                                      ></op-entity-toggle>

                                      <mwc-button
                                        @click=${this._runActions}
                                        .stateObj=${stateObj}
                                      >
                                        ${this.opp.localize(
                                          "ui.card.automation.trigger"
                                        )}
                                      </mwc-button>
                                    </div>
                                  `
                                : ""}
                            </op-card>
                          `
                        : ``}
                      <op-yaml-editor
                        .defaultValue=${this._preprocessYaml()}
                        @value-changed=${this._yamlChanged}
                      ></op-yaml-editor>
                      <op-card
                        ><div class="card-actions">
                          <mwc-button @click=${this._copyYaml}>
                            ${this.opp.localize(
                              "ui.panel.config.automation.editor.copy_to_clipboard"
                            )}
                          </mwc-button>
                        </div>
                      </op-card>
                    `
                  : ``}
              </div>
            `
          : ""}
        <op-fab
          slot="fab"
          class=${classMap({ dirty: this._dirty })}
          .label=${this.opp.localize("ui.panel.config.automation.editor.save")}
          extended
          @click=${this._saveAutomation}
        >
          <op-svg-icon slot="icon" .path=${mdiContentSave}></op-svg-icon>
        </op-fab>
      </opp-tabs-subpage>
    `;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    const oldAutomationId = changedProps.get("automationId");
    if (
      changedProps.has("automationId") &&
      this.automationId &&
      this.opp &&
      // Only refresh config if we picked a new automation. If same ID, don't fetch it.
      oldAutomationId !== this.automationId
    ) {
      this._setEntityId();
      this._loadConfig();
    }

    if (changedProps.has("automationId") && !this.automationId && this.opp) {
      const initData = getAutomationEditorInitData();
      let baseConfig: Partial<AutomationConfig> = {
        alias: this.opp.localize(
          "ui.panel.config.automation.editor.default_name"
        ),
        description: "",
      };
      if (!initData || !("use_blueprint" in initData)) {
        baseConfig = {
          ...baseConfig,
          mode: "single",
          trigger: [{ platform: "device", ...HaDeviceTrigger.defaultConfig }],
          condition: [],
          action: [{ ...HaDeviceAction.defaultConfig }],
        };
      }
      this._config = {
        ...baseConfig,
        ...initData,
      } as AutomationConfig;
      this._entityId = undefined;
    }

    if (
      changedProps.has("automations") &&
      this.automationId &&
      !this._entityId
    ) {
      this._setEntityId();
    }
  }

  private _setEntityId() {
    const automation = this.automations.find(
      (entity: AutomationEntity) => entity.attributes.id === this.automationId
    );
    this._entityId = automation?.entity_id;
  }

  private async _loadConfig() {
    try {
      const config = await getAutomationConfig(this.opp, this.automationId);

      // Normalize data: ensure trigger, action and condition are lists
      // Happens when people copy paste their automations into the config
      for (const key of ["trigger", "condition", "action"]) {
        const value = config[key];
        if (value && !Array.isArray(value)) {
          config[key] = [value];
        }
      }
      this._dirty = false;
      this._config = config;
    } catch (err) {
      showAlertDialog(this, {
        text:
          err.status_code === 404
            ? this.opp.localize(
                "ui.panel.config.automation.editor.load_error_not_editable"
              )
            : this.opp.localize(
                "ui.panel.config.automation.editor.load_error_unknown",
                "err_no",
                err.status_code
              ),
      }).then(() => history.back());
    }
  }

  private _valueChanged(ev: CustomEvent<{ value: AutomationConfig }>) {
    ev.stopPropagation();
    this._config = ev.detail.value;
    this._dirty = true;
    this._errors = undefined;
  }

  private _runActions(ev: Event) {
    triggerAutomationActions(this.opp, (ev.target as any).stateObj.entity_id);
  }

  private _preprocessYaml() {
    const cleanConfig = this._config;
    if (!cleanConfig) {
      return {};
    }

    delete cleanConfig.id;

    return cleanConfig;
  }

  private async _copyYaml(): Promise<void> {
    if (this._editor?.yaml) {
      await copyToClipboard(this._editor.yaml);
      showToast(this, {
        message: this.opp.localize("ui.common.copied_clipboard"),
      });
    }
  }

  private _yamlChanged(ev: CustomEvent) {
    ev.stopPropagation();
    if (!ev.detail.isValid) {
      return;
    }
    this._config = ev.detail.value;
    this._errors = undefined;
    this._dirty = true;
  }

  private _backTapped(): void {
    if (this._dirty) {
      showConfirmationDialog(this, {
        text: this.opp!.localize(
          "ui.panel.config.automation.editor.unsaved_confirm"
        ),
        confirmText: this.opp!.localize("ui.common.leave"),
        dismissText: this.opp!.localize("ui.common.stay"),
        confirm: () => history.back(),
      });
    } else {
      history.back();
    }
  }

  private async _duplicate() {
    if (this._dirty) {
      if (
        !(await showConfirmationDialog(this, {
          text: this.opp!.localize(
            "ui.panel.config.automation.editor.unsaved_confirm"
          ),
          confirmText: this.opp!.localize("ui.common.leave"),
          dismissText: this.opp!.localize("ui.common.stay"),
        }))
      ) {
        return;
      }
      // Wait for dialog to complate closing
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    showAutomationEditor(this, {
      ...this._config,
      id: undefined,
      alias: `${this._config?.alias} (${this.opp.localize(
        "ui.panel.config.automation.picker.duplicate"
      )})`,
    });
  }

  private async _deleteConfirm() {
    showConfirmationDialog(this, {
      text: this.opp.localize(
        "ui.panel.config.automation.picker.delete_confirm"
      ),
      confirmText: this.opp!.localize("ui.common.delete"),
      dismissText: this.opp!.localize("ui.common.cancel"),
      confirm: () => this._delete(),
    });
  }

  private async _delete() {
    await deleteAutomation(this.opp, this.automationId);
    history.back();
  }

  private async _handleMenuAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        this._mode = "gui";
        break;
      case 1:
        this._mode = "yaml";
        break;
      case 2:
        this._duplicate();
        break;
      case 3:
        this._deleteConfirm();
        break;
    }
  }

  private _saveAutomation(): void {
    const id = this.automationId || String(Date.now());
    this.opp!.callApi(
      "POST",
      "config/automation/config/" + id,
      this._config
    ).then(
      () => {
        this._dirty = false;

        if (!this.automationId) {
          navigate(this, `/config/automation/edit/${id}`, true);
        }
      },
      (errors) => {
        this._errors = errors.body.message || errors.error || errors.body;
        showToast(this, {
          message: errors.body.message || errors.error || errors.body,
        });
        throw errors;
      }
    );
  }

  protected handleKeyboardSave() {
    this._saveAutomation();
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        op-card {
          overflow: hidden;
        }
        .errors {
          padding: 20px;
          font-weight: bold;
          color: var(--error-color);
        }
        .content {
          padding-bottom: 20px;
        }
        .yaml-mode {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding-bottom: 0;
        }
        op-yaml-editor {
          flex-grow: 1;
          --code-mirror-height: 100%;
          min-height: 0;
        }
        .yaml-mode op-card {
          overflow: initial;
          --op-card-border-radius: 0;
          border-bottom: 1px solid var(--divider-color);
        }
        p {
          margin-bottom: 0;
        }
        op-entity-toggle {
          margin-right: 8px;
        }
        op-fab {
          position: relative;
          bottom: calc(-80px - env(safe-area-inset-bottom));
          transition: bottom 0.3s;
        }
        op-fab.dirty {
          bottom: 0;
        }
        .selected_menu_item {
          color: var(--primary-color);
        }
        li[role="separator"] {
          border-bottom-color: var(--divider-color);
        }
      `,
    ];
  }
}

customElements.define("op-automation-editor", HaAutomationEditor);
