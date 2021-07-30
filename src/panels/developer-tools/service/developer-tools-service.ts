import { safeLoad } from "js-yaml";
import {
  css,
  CSSResultArray,
  html,
  internalProperty,
  LitElement,
  property,
  query,
} from "lit-element";
import memoizeOne from "memoize-one";
import { LocalStorage } from "../../../common/decorators/local-storage";
import { computeDomain } from "../../../common/entity/compute_domain";
import { computeObjectId } from "../../../common/entity/compute_object_id";
import { hasTemplate } from "../../../common/string/has-template";
import { extractSearchParam } from "../../../common/url/search-params";
import "../../../components/buttons/ha-progress-button";
import "../../../components/entity/ha-entity-picker";
import "../../../components/ha-card";
import "../../../components/ha-expansion-panel";
import "../../../components/ha-service-control";
import "../../../components/ha-service-picker";
import "../../../components/ha-yaml-editor";
import type { HaYamlEditor } from "../../../components/ha-yaml-editor";
import { ServiceAction } from "../../../data/script";
import { callExecuteScript } from "../../../data/service";
import { haStyle } from "../../../resources/styles";
import "../../../styles/polymer-op-style";
import { OpenPeerPower } from "../../../types";
import "../../../util/app-localstorage-document";
import { showToast } from "../../../util/toast";

class HaPanelDevService extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ type: Boolean }) public narrow!: boolean;

  @internalProperty() private _uiAvailable = true;

  @LocalStorage("panel-dev-service-state-service-data", true)
  private _serviceData?: ServiceAction = { service: "", target: {}, data: {} };

  @LocalStorage("panel-dev-service-state-yaml-mode", true)
  private _yamlMode = false;

  @query("ha-yaml-editor") private _yamlEditor?: HaYamlEditor;

  protected firstUpdated(params) {
    super.firstUpdated(params);
    const serviceParam = extractSearchParam("service");
    if (serviceParam) {
      this._serviceData = {
        service: serviceParam,
        target: {},
        data: {},
      };
      if (this._yamlMode) {
        this.updateComplete.then(() =>
          this._yamlEditor?.setValue(this._serviceData)
        );
      }
    } else if (!this._serviceData?.service) {
      const domain = Object.keys(this.opp.services).sort()[0];
      const service = Object.keys(this.opp.services[domain]).sort()[0];
      this._serviceData = {
        service: `${domain}.${service}`,
        target: {},
        data: {},
      };
      if (this._yamlMode) {
        this.updateComplete.then(() =>
          this._yamlEditor?.setValue(this._serviceData)
        );
      }
    }
    this._checkUiSupported();
  }

  protected render() {
    const { target, fields } = this._fields(
      this.opp.services,
      this._serviceData?.service
    );

    const isValid = this._isValid(this._serviceData, fields, target);

    return html`
      <div class="content">
        <p>
          ${this.opp.localize(
            "ui.panel.developer-tools.tabs.services.description"
          )}
        </p>

        ${this._yamlMode
          ? html`<op-service-picker
                .opp=${this.opp}
                .value=${this._serviceData?.service}
                @value-changed=${this._serviceChanged}
              ></op-service-picker>
              <op-yaml-editor
                .defaultValue=${this._serviceData}
                @value-changed=${this._yamlChanged}
              ></op-yaml-editor>`
          : html`<op-card
              ><div>
                <op-service-control
                  .opp=${this.opp}
                  .value=${this._serviceData}
                  .narrow=${this.narrow}
                  showAdvanced
                  @value-changed=${this._serviceDataChanged}
                ></op-service-control></div
            ></op-card>`}
      </div>
      <div class="button-row">
        <div class="buttons">
          <div class="switch-mode-container">
            <mwc-button
              @click=${this._toggleYaml}
              .disabled=${!this._uiAvailable}
            >
              ${this._yamlMode
                ? this.opp.localize(
                    "ui.panel.developer-tools.tabs.services.ui_mode"
                  )
                : this.opp.localize(
                    "ui.panel.developer-tools.tabs.services.yaml_mode"
                  )}
            </mwc-button>
            ${!this._uiAvailable
              ? html`<span class="error"
                  >${this.opp.localize(
                    "ui.panel.developer-tools.tabs.services.no_template_ui_support"
                  )}</span
                >`
              : ""}
          </div>
          <mwc-button .disabled=${!isValid} raised @click=${this._callService}>
            ${this.opp.localize(
              "ui.panel.developer-tools.tabs.services.call_service"
            )}
          </mwc-button>
        </div>
      </div>

      ${(this._yamlMode ? fields : this._filterSelectorFields(fields)).length
        ? html`<div class="content">
            <op-expansion-panel
              .header=${this._yamlMode
                ? this.opp.localize(
                    "ui.panel.developer-tools.tabs.services.all_parameters"
                  )
                : this.opp.localize(
                    "ui.panel.developer-tools.tabs.services.yaml_parameters"
                  )}
              outlined
              .expanded=${this._yamlMode}
            >
              ${this._yamlMode && target
                ? html`<h3>
                    ${this.opp.localize(
                      "ui.panel.developer-tools.tabs.services.accepts_target"
                    )}
                  </h3>`
                : ""}
              <table class="attributes">
                <tr>
                  <th>
                    ${this.opp.localize(
                      "ui.panel.developer-tools.tabs.services.column_parameter"
                    )}
                  </th>
                  <th>
                    ${this.opp.localize(
                      "ui.panel.developer-tools.tabs.services.column_description"
                    )}
                  </th>
                  <th>
                    ${this.opp.localize(
                      "ui.panel.developer-tools.tabs.services.column_example"
                    )}
                  </th>
                </tr>
                ${(this._yamlMode
                  ? fields
                  : this._filterSelectorFields(fields)
                ).map(
                  (field) => html` <tr>
                    <td><pre>${field.key}</pre></td>
                    <td>${field.description}</td>
                    <td>${field.example}</td>
                  </tr>`
                )}
              </table>
              ${this._yamlMode
                ? html`<mwc-button @click=${this._fillExampleData}
                    >${this.opp.localize(
                      "ui.panel.developer-tools.tabs.services.fill_example_data"
                    )}</mwc-button
                  >`
                : ""}
            </op-expansion-panel>
          </div>`
        : ""}
    `;
  }

  private _filterSelectorFields = memoizeOne((fields) =>
    fields.filter((field) => !field.selector)
  );

  private _isValid = memoizeOne((serviceData, fields, target): boolean => {
    if (!serviceData?.service) {
      return false;
    }
    const domain = computeDomain(serviceData.service);
    const service = computeObjectId(serviceData.service);
    if (!domain || !service) {
      return false;
    }
    if (
      target &&
      !serviceData.target &&
      !serviceData.data?.entity_id &&
      !serviceData.data?.device_id &&
      !serviceData.data?.area_id
    ) {
      return false;
    }
    for (const field of fields) {
      if (
        field.required &&
        (!serviceData.data || serviceData.data[field.key] === undefined)
      ) {
        return false;
      }
    }
    return true;
  });

  private _fields = memoizeOne(
    (
      serviceDomains: OpenPeerPower["services"],
      domainService: string | undefined
    ): { target: boolean; fields: any[] } => {
      if (!domainService) {
        return { target: false, fields: [] };
      }
      const domain = computeDomain(domainService);
      const service = computeObjectId(domainService);
      if (!(domain in serviceDomains)) {
        return { target: false, fields: [] };
      }
      if (!(service in serviceDomains[domain])) {
        return { target: false, fields: [] };
      }
      const target = "target" in serviceDomains[domain][service];
      const fields = serviceDomains[domain][service].fields;
      const result = Object.keys(fields).map((field) => {
        return { key: field, ...fields[field] };
      });

      return {
        target,
        fields: result,
      };
    }
  );

  private async _callService() {
    if (!this._serviceData?.service) {
      return;
    }
    try {
      await callExecuteScript(this.opp, [this._serviceData]);
    } catch (err) {
      showToast(this, {
        message:
          this.opp.localize(
            "ui.notification_toast.service_call_failed",
            "service",
            this._serviceData.service
          ) + ` ${err.message}`,
      });
    }
  }

  private _toggleYaml() {
    this._yamlMode = !this._yamlMode;
  }

  private _yamlChanged(ev) {
    if (!ev.detail.isValid) {
      return;
    }
    this._serviceDataChanged(ev);
  }

  private _checkUiSupported() {
    if (this._serviceData && hasTemplate(this._serviceData)) {
      this._yamlMode = true;
      this._uiAvailable = false;
    } else {
      this._uiAvailable = true;
    }
  }

  private _serviceDataChanged(ev) {
    this._serviceData = ev.detail.value;
    this._checkUiSupported();
  }

  private _serviceChanged(ev) {
    ev.stopPropagation();
    this._serviceData = { service: ev.detail.value || "", data: {} };
    this._yamlEditor?.setValue(this._serviceData);
  }

  private _fillExampleData() {
    const { fields } = this._fields(
      this.opp.services,
      this._serviceData?.service
    );
    const example = {};
    fields.forEach((field) => {
      if (field.example) {
        let value = "";
        try {
          value = safeLoad(field.example);
        } catch (err) {
          value = field.example;
        }
        example[field.key] = value;
      }
    });
    this._serviceData = { ...this._serviceData!, data: example };
    this._yamlEditor?.setValue(this._serviceData);
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        .content {
          padding: 16px;
          max-width: 1200px;
          margin: auto;
        }
        .button-row {
          padding: 8px 16px;
          border-top: 1px solid var(--divider-color);
          border-bottom: 1px solid var(--divider-color);
          background: var(--card-background-color);
          position: sticky;
          bottom: 0;
          box-sizing: border-box;
          width: 100%;
        }
        .button-row .buttons {
          display: flex;
          justify-content: space-between;
          max-width: 1200px;
          margin: auto;
        }
        .switch-mode-container {
          display: flex;
          align-items: center;
        }
        .switch-mode-container .error {
          margin-left: 8px;
        }
        .attributes {
          width: 100%;
        }

        .attributes th {
          text-align: left;
          background-color: var(--card-background-color);
          border-bottom: 1px solid var(--primary-text-color);
        }

        :host([rtl]) .attributes th {
          text-align: right;
        }

        .attributes tr {
          vertical-align: top;
          direction: ltr;
        }

        .attributes tr:nth-child(odd) {
          background-color: var(--table-row-background-color, #eee);
        }

        .attributes tr:nth-child(even) {
          background-color: var(--table-row-alternative-background-color, #eee);
        }

        .attributes td:nth-child(3) {
          white-space: pre-wrap;
          word-break: break-word;
        }

        .attributes td {
          padding: 4px;
          vertical-align: middle;
        }
      `,
    ];
  }
}

customElements.define("developer-tools-service", HaPanelDevService);

declare global {
  interface HTMLElementTagNameMap {
    "developer-tools-service": HaPanelDevService;
  }
}
