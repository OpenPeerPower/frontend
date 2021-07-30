import "@material/mwc-button";
import { ActionDetail } from "@material/mwc-list";
import "@material/mwc-list/mwc-list-item";
import { mdiDotsVertical } from "@mdi/js";
import { DEFAULT_SCHEMA, Type } from "js-yaml";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { customElement, property, query, state } from "lit/decorators";
import memoizeOne from "memoize-one";
import { fireEvent } from "../../../../src/common/dom/fire_event";
import "../../../../src/components/buttons/ha-progress-button";
import "../../../../src/components/ha-button-menu";
import "../../../../src/components/ha-card";
import "../../../../src/components/ha-form/ha-form";
import type { HaFormSchema } from "../../../../src/components/ha-form/ha-form";
import "../../../../src/components/ha-formfield";
import "../../../../src/components/ha-switch";
import "../../../../src/components/ha-yaml-editor";
import type { HaYamlEditor } from "../../../../src/components/ha-yaml-editor";
import {
  OppioAddonDetails,
  OppioAddonSetOptionParams,
  setOppioAddonOption,
  validateOppioAddonOption,
} from "../../../../src/data/oppio/addon";
import { extractApiErrorMessage } from "../../../../src/data/oppio/common";
import { Supervisor } from "../../../../src/data/supervisor/supervisor";
import { showConfirmationDialog } from "../../../../src/dialogs/generic/show-dialog-box";
import { haStyle } from "../../../../src/resources/styles";
import type { OpenPeerPower } from "../../../../src/types";
import { suggestAddonRestart } from "../../dialogs/suggestAddonRestart";
import { oppioStyle } from "../../resources/oppio-style";

const SUPPORTED_UI_TYPES = ["string", "select", "boolean", "integer", "float"];

const ADDON_YAML_SCHEMA = DEFAULT_SCHEMA.extend([
  new Type("!secret", {
    kind: "scalar",
    construct: (data) => `!secret ${data}`,
  }),
]);

@customElement("oppio-addon-config")
class OppioAddonConfig extends LitElement {
  @property({ attribute: false }) public addon!: OppioAddonDetails;

  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ type: Boolean }) private _configHasChanged = false;

  @property({ type: Boolean }) private _valid = true;

  @state() private _canShowSchema = false;

  @state() private _showOptional = false;

  @state() private _error?: string;

  @state() private _options?: Record<string, unknown>;

  @state() private _yamlMode = false;

  @query("ha-yaml-editor") private _editor?: HaYamlEditor;

  public computeLabel = (entry: HaFormSchema): string =>
    this.addon.translations[this.opp.language]?.configuration?.[entry.name]
      ?.name ||
    this.addon.translations.en?.configuration?.[entry.name].name ||
    entry.name;

  private _filteredShchema = memoizeOne(
    (options: Record<string, unknown>, schema: HaFormSchema[]) =>
      schema.filter((entry) => entry.name in options || entry.required)
  );

  protected render(): TemplateResult {
    const showForm =
      !this._yamlMode && this._canShowSchema && this.addon.schema;
    const hasHiddenOptions =
      showForm &&
      JSON.stringify(this.addon.schema) !==
        JSON.stringify(
          this._filteredShchema(this.addon.options, this.addon.schema!)
        );
    return html`
      <h1>${this.addon.name}</h1>
      <op-card>
        <div class="header">
          <h2>
            ${this.supervisor.localize("addon.configuration.options.header")}
          </h2>
          <div class="card-menu">
            <op-button-menu corner="BOTTOM_START" @action=${this._handleAction}>
              <mwc-icon-button slot="trigger">
                <op-svg-icon .path=${mdiDotsVertical}></op-svg-icon>
              </mwc-icon-button>
              <mwc-list-item .disabled=${!this._canShowSchema}>
                ${this._yamlMode
                  ? this.supervisor.localize(
                      "addon.configuration.options.edit_in_ui"
                    )
                  : this.supervisor.localize(
                      "addon.configuration.options.edit_in_yaml"
                    )}
              </mwc-list-item>
              <mwc-list-item class="warning">
                ${this.supervisor.localize("common.reset_defaults")}
              </mwc-list-item>
            </op-button-menu>
          </div>
        </div>

        <div class="card-content">
          ${showForm
            ? html`<op-form
                .data=${this._options!}
                @value-changed=${this._configChanged}
                .computeLabel=${this.computeLabel}
                .schema=${this._showOptional
                  ? this.addon.schema!
                  : this._filteredShchema(
                      this.addon.options,
                      this.addon.schema!
                    )}
              ></op-form>`
            : html` <op-yaml-editor
                @value-changed=${this._configChanged}
                .yamlSchema=${ADDON_YAML_SCHEMA}
              ></op-yaml-editor>`}
          ${this._error ? html` <div class="errors">${this._error}</div> ` : ""}
          ${!this._yamlMode ||
          (this._canShowSchema && this.addon.schema) ||
          this._valid
            ? ""
            : html`
                <div class="errors">
                  ${this.supervisor.localize(
                    "addon.configuration.options.invalid_yaml"
                  )}
                </div>
              `}
        </div>
        ${hasHiddenOptions
          ? html`<op-formfield
              class="show-additional"
              .label=${this.supervisor.localize(
                "addon.configuration.options.show_unused_optional"
              )}
            >
              <op-switch
                @change=${this._toggleOptional}
                .checked=${this._showOptional}
              >
              </op-switch>
            </op-formfield>`
          : ""}
        <div class="card-actions right">
          <op-progress-button
            @click=${this._saveTapped}
            .disabled=${!this._configHasChanged || !this._valid}
          >
            ${this.supervisor.localize("common.save")}
          </op-progress-button>
        </div>
      </op-card>
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    this._canShowSchema = !this.addon.schema!.find(
      // @ts-ignore
      (entry) => !SUPPORTED_UI_TYPES.includes(entry.type) || entry.multiple
    );
    this._yamlMode = !this._canShowSchema;
  }

  protected updated(changedProperties: PropertyValues): void {
    if (changedProperties.has("addon")) {
      this._options = { ...this.addon.options };
    }
    super.updated(changedProperties);
    if (
      changedProperties.has("_yamlMode") ||
      changedProperties.has("_options")
    ) {
      if (this._yamlMode) {
        const editor = this._editor;
        if (editor) {
          editor.setValue(this._options!);
        }
      }
    }
  }

  private _handleAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        this._yamlMode = !this._yamlMode;
        break;
      case 1:
        this._resetTapped(ev);
        break;
    }
  }

  private _toggleOptional() {
    this._showOptional = !this._showOptional;
  }

  private _configChanged(ev): void {
    if (this.addon.schema && this._canShowSchema && !this._yamlMode) {
      this._valid = true;
      this._configHasChanged = true;
      this._options! = ev.detail.value;
    } else {
      this._configHasChanged = true;
      this._valid = ev.detail.isValid;
    }
  }

  private async _resetTapped(ev: CustomEvent): Promise<void> {
    const button = ev.currentTarget as any;
    button.progress = true;

    const confirmed = await showConfirmationDialog(this, {
      title: this.supervisor.localize("confirm.reset_options.title"),
      text: this.supervisor.localize("confirm.reset_options.text"),
      confirmText: this.supervisor.localize("common.reset_options"),
      dismissText: this.supervisor.localize("common.cancel"),
    });

    if (!confirmed) {
      button.progress = false;
      return;
    }

    this._error = undefined;
    const data: OppioAddonSetOptionParams = {
      options: null,
    };
    try {
      await setOppioAddonOption(this.opp, this.addon.slug, data);
      this._configHasChanged = false;
      const eventdata = {
        success: true,
        response: undefined,
        path: "options",
      };
      fireEvent(this, "opp-api-called", eventdata);
    } catch (err) {
      this._error = this.supervisor.localize(
        "addon.common.update_available",
        "error",
        extractApiErrorMessage(err)
      );
    }
    button.progress = false;
  }

  private async _saveTapped(ev: CustomEvent): Promise<void> {
    const button = ev.currentTarget as any;
    const options: Record<string, unknown> = this._yamlMode
      ? this._editor?.value
      : this._options;
    const eventdata = {
      success: true,
      response: undefined,
      path: "options",
    };
    button.progress = true;

    this._error = undefined;

    try {
      const validation = await validateOppioAddonOption(
        this.opp,
        this.addon.slug,
        options
      );
      if (!validation.valid) {
        throw Error(validation.message);
      }
      await setOppioAddonOption(this.opp, this.addon.slug, {
        options,
      });

      this._configHasChanged = false;
      if (this.addon?.state === "started") {
        await suggestAddonRestart(this, this.opp, this.supervisor, this.addon);
      }
    } catch (err) {
      this._error = this.supervisor.localize(
        "addon.failed_to_save",
        "error",
        extractApiErrorMessage(err)
      );
      eventdata.success = false;
    }
    button.progress = false;
    fireEvent(this, "opp-api-called", eventdata);
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      oppioStyle,
      css`
        :host {
          display: block;
        }
        ha-card {
          display: block;
        }
        .card-actions {
          display: flex;
          justify-content: space-between;
        }
        .errors {
          color: var(--error-color);
          margin-top: 16px;
        }
        .syntaxerror {
          color: var(--error-color);
        }
        .card-menu {
          float: right;
          z-index: 3;
          --mdc-theme-text-primary-on-background: var(--primary-text-color);
        }
        mwc-list-item[disabled] {
          --mdc-theme-text-primary-on-background: var(--disabled-text-color);
        }
        .header {
          display: flex;
          justify-content: space-between;
        }
        .header h2 {
          color: var(--op-card-header-color, --primary-text-color);
          font-family: var(--op-card-header-font-family, inherit);
          font-size: var(--op-card-header-font-size, 24px);
          letter-spacing: -0.012em;
          line-height: 48px;
          padding: 12px 16px 16px;
          display: block;
          margin-block: 0px;
          font-weight: normal;
        }
        .card-actions.right {
          justify-content: flex-end;
        }

        .show-additional {
          padding: 16px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-addon-config": OppioAddonConfig;
  }
}
