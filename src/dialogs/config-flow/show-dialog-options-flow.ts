import { html } from "lit-element";
import { localizeKey } from "../../common/translations/localize";
import { ConfigEntry } from "../../data/config_entries";
import {
  createOptionsFlow,
  deleteOptionsFlow,
  fetchOptionsFlow,
  handleOptionsFlowStep,
} from "../../data/options_flow";
import {
  loadDataEntryFlowDialog,
  showFlowDialog,
} from "./show-dialog-data-entry-flow";

export const loadOptionsFlowDialog = loadDataEntryFlowDialog;

export const showOptionsFlowDialog = (
  element: HTMLElement,
  configEntry: ConfigEntry
): void =>
  showFlowDialog(
    element,
    {
      startFlowHandler: configEntry.entry_id,
    },
    {
      loadDevicesAndAreas: false,
      createFlow: async (opp, handler) => {
        const [step] = await Promise.all([
          createOptionsFlow(opp, handler),
          opp.loadBackendTranslation("options", configEntry.domain),
        ]);
        return step;
      },
      fetchFlow: async (opp, flowId) => {
        const [step] = await Promise.all([
          fetchOptionsFlow(opp, flowId),
          opp.loadBackendTranslation("options", configEntry.domain),
        ]);
        return step;
      },
      handleFlowStep: handleOptionsFlowStep,
      deleteFlow: deleteOptionsFlow,

      renderAbortDescription(opp, step) {
        const description = localizeKey(
          opp.localize,
          `component.${configEntry.domain}.options.abort.${step.reason}`,
          step.description_placeholders
        );

        return description
          ? html`
              <ha-markdown
                breaks
                allowsvg
                .content=${description}
              ></ha-markdown>
            `
          : "";
      },

      renderShowFormStepHeader(opp, step) {
        return (
          opp.localize(
            `component.${configEntry.domain}.options.step.${step.step_id}.title`
          ) || opp.localize(`ui.dialogs.options_flow.form.header`)
        );
      },

      renderShowFormStepDescription(opp, step) {
        const description = localizeKey(
          opp.localize,
          `component.${configEntry.domain}.options.step.${step.step_id}.description`,
          step.description_placeholders
        );
        return description
          ? html`
              <ha-markdown
                allowsvg
                breaks
                .content=${description}
              ></ha-markdown>
            `
          : "";
      },

      renderShowFormStepFieldLabel(opp, step, field) {
        return opp.localize(
          `component.${configEntry.domain}.options.step.${step.step_id}.data.${field.name}`
        );
      },

      renderShowFormStepFieldError(opp, _step, error) {
        return opp.localize(
          `component.${configEntry.domain}.options.error.${error}`
        );
      },

      renderExternalStepHeader(_opp, _step) {
        return "";
      },

      renderExternalStepDescription(_opp, _step) {
        return "";
      },

      renderCreateEntryDescription(opp, _step) {
        return html`
          <p>${opp.localize(`ui.dialogs.options_flow.success.description`)}</p>
        `;
      },

      renderShowFormProgressHeader(_opp, _step) {
        return "";
      },

      renderShowFormProgressDescription(_opp, _step) {
        return "";
      },
    }
  );
