import { html } from "lit";
import { caseInsensitiveCompare } from "../../common/string/compare";
import {
  createConfigFlow,
  deleteConfigFlow,
  fetchConfigFlow,
  getConfigFlowHandlers,
  handleConfigFlowStep,
} from "../../data/config_flow";
import { domainToName } from "../../data/integration";
import {
  DataEntryFlowDialogParams,
  loadDataEntryFlowDialog,
  showFlowDialog,
} from "./show-dialog-data-entry-flow";

export const loadConfigFlowDialog = loadDataEntryFlowDialog;

export const showConfigFlowDialog = (
  element: HTMLElement,
  dialogParams: Omit<DataEntryFlowDialogParams, "flowConfig">
): void =>
  showFlowDialog(element, dialogParams, {
    loadDevicesAndAreas: true,
    getFlowHandlers: async (opp) => {
      const [handlers] = await Promise.all([
        getConfigFlowHandlers(opp),
        opp.loadBackendTranslation("title", undefined, true),
      ]);

      return handlers.sort((handlerA, handlerB) =>
        caseInsensitiveCompare(
          domainToName(opp.localize, handlerA),
          domainToName(opp.localize, handlerB)
        )
      );
    },
    createFlow: async (opp, handler) => {
      const [step] = await Promise.all([
        createConfigFlow(opp, handler),
        opp.loadBackendTranslation("config", handler),
      ]);
      return step;
    },
    fetchFlow: async (opp, flowId) => {
      const step = await fetchConfigFlow(opp, flowId);
      await opp.loadBackendTranslation("config", step.handler);
      return step;
    },
    handleFlowStep: handleConfigFlowStep,
    deleteFlow: deleteConfigFlow,

    renderAbortDescription(opp, step) {
      const description = opp.localize(
        `component.${step.handler}.config.abort.${step.reason}`,
        step.description_placeholders
      );

      return description
        ? html`
            <op-markdown allowsvg breaks .content=${description}></op-markdown>
          `
        : "";
    },

    renderShowFormStepHeader(opp, step) {
      return (
        opp.localize(
          `component.${step.handler}.config.step.${step.step_id}.title`
        ) || opp.localize(`component.${step.handler}.title`)
      );
    },

    renderShowFormStepDescription(opp, step) {
      const description = opp.localize(
        `component.${step.handler}.config.step.${step.step_id}.description`,
        step.description_placeholders
      );
      return description
        ? html`
            <op-markdown allowsvg breaks .content=${description}></op-markdown>
          `
        : "";
    },

    renderShowFormStepFieldLabel(opp, step, field) {
      return opp.localize(
        `component.${step.handler}.config.step.${step.step_id}.data.${field.name}`
      );
    },

    renderShowFormStepFieldError(opp, step, error) {
      return opp.localize(
        `component.${step.handler}.config.error.${error}`,
        step.description_placeholders
      );
    },

    renderExternalStepHeader(opp, step) {
      return (
        opp.localize(
          `component.${step.handler}.config.step.${step.step_id}.title`
        ) ||
        opp.localize(
          "ui.panel.config.integrations.config_flow.external_step.open_site"
        )
      );
    },

    renderExternalStepDescription(opp, step) {
      const description = opp.localize(
        `component.${step.handler}.config.${step.step_id}.description`,
        step.description_placeholders
      );

      return html`
        <p>
          ${opp.localize(
            "ui.panel.config.integrations.config_flow.external_step.description"
          )}
        </p>
        ${description
          ? html`
              <op-markdown
                allowsvg
                breaks
                .content=${description}
              ></op-markdown>
            `
          : ""}
      `;
    },

    renderCreateEntryDescription(opp, step) {
      const description = opp.localize(
        `component.${step.handler}.config.create_entry.${
          step.description || "default"
        }`,
        step.description_placeholders
      );

      return html`
        ${description
          ? html`
              <op-markdown
                allowsvg
                breaks
                .content=${description}
              ></op-markdown>
            `
          : ""}
        <p>
          ${opp.localize(
            "ui.panel.config.integrations.config_flow.created_config",
            "name",
            step.title
          )}
        </p>
      `;
    },

    renderShowFormProgressHeader(opp, step) {
      return (
        opp.localize(
          `component.${step.handler}.config.step.${step.step_id}.title`
        ) || opp.localize(`component.${step.handler}.title`)
      );
    },

    renderShowFormProgressDescription(opp, step) {
      const description = opp.localize(
        `component.${step.handler}.config.progress.${step.progress_action}`,
        step.description_placeholders
      );
      return description
        ? html`
            <op-markdown allowsvg breaks .content=${description}></op-markdown>
          `
        : "";
    },

    renderLoadingDescription(opp, reason, handler, step) {
      if (!["loading_flow", "loading_step"].includes(reason)) {
        return "";
      }
      const domain = step?.handler || handler;
      return opp.localize(
        `ui.panel.config.integrations.config_flow.loading.${reason}`,
        {
          integration: domain
            ? domainToName(opp.localize, domain)
            : // when we are continuing a config flow, we only know the ID and not the domain
              opp.localize(
                "ui.panel.config.integrations.config_flow.loading.fallback_title"
              ),
        }
      );
    },
  });
