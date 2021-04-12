import { fireEvent } from "../../../common/dom/fire_event";
import { navigate } from "../../../common/navigate";
import { forwardHaptic } from "../../../data/haptics";
import { domainToName } from "../../../data/integration";
import { ActionConfig } from "../../../data/lovelace";
import { showConfirmationDialog } from "../../../dialogs/generic/show-dialog-box";
import { OpenPeerPower } from "../../../types";
import { showToast } from "../../../util/toast";
import { toggleEntity } from "./entity/toggle-entity";

declare global {
  interface OPPDomEvents {
    "ll-custom": ActionConfig;
  }
}

export const handleAction = async (
  node: HTMLElement,
  opp: OpenPeerPower,
  config: {
    entity?: string;
    camera_image?: string;
    hold_action?: ActionConfig;
    tap_action?: ActionConfig;
    double_tap_action?: ActionConfig;
  },
  action: string
): Promise<void> => {
  let actionConfig: ActionConfig | undefined;

  if (action === "double_tap" && config.double_tap_action) {
    actionConfig = config.double_tap_action;
  } else if (action === "hold" && config.hold_action) {
    actionConfig = config.hold_action;
  } else if (action === "tap" && config.tap_action) {
    actionConfig = config.tap_action;
  }

  if (!actionConfig) {
    actionConfig = {
      action: "more-info",
    };
  }

  if (
    actionConfig.confirmation &&
    (!actionConfig.confirmation.exemptions ||
      !actionConfig.confirmation.exemptions.some(
        (e) => e.user === opp!.user!.id
      ))
  ) {
    forwardHaptic("warning");

    let serviceName;
    if (actionConfig.action === "call-service") {
      const [domain, service] = actionConfig.service.split(".", 2);
      const serviceDomains = opp.services;
      if (domain in serviceDomains && service in serviceDomains[domain]) {
        const localize = await opp.loadBackendTranslation("title");
        serviceName = `${domainToName(localize, domain)}: ${
          serviceDomains[domain][service].name || service
        }`;
      }
    }

    if (
      !(await showConfirmationDialog(node, {
        text:
          actionConfig.confirmation.text ||
          opp.localize(
            "ui.panel.lovelace.cards.actions.action_confirmation",
            "action",
            serviceName ||
              opp.localize(
                "ui.panel.lovelace.editor.action-editor.actions." +
                  actionConfig.action
              ) ||
              actionConfig.action
          ),
      }))
    ) {
      return;
    }
  }

  switch (actionConfig.action) {
    case "more-info": {
      if (config.entity || config.camera_image) {
        fireEvent(node, "opp-more-info", {
          entityId: config.entity ? config.entity : config.camera_image!,
        });
      } else {
        showToast(node, {
          message: opp.localize(
            "ui.panel.lovelace.cards.actions.no_entity_more_info"
          ),
        });
        forwardHaptic("failure");
      }
      break;
    }
    case "navigate":
      if (actionConfig.navigation_path) {
        navigate(node, actionConfig.navigation_path);
      } else {
        showToast(node, {
          message: opp.localize(
            "ui.panel.lovelace.cards.actions.no_navigation_path"
          ),
        });
        forwardHaptic("failure");
      }
      break;
    case "url": {
      if (actionConfig.url_path) {
        window.open(actionConfig.url_path);
      } else {
        showToast(node, {
          message: opp.localize("ui.panel.lovelace.cards.actions.no_url"),
        });
        forwardHaptic("failure");
      }
      break;
    }
    case "toggle": {
      if (config.entity) {
        toggleEntity(opp, config.entity!);
        forwardHaptic("light");
      } else {
        showToast(node, {
          message: opp.localize(
            "ui.panel.lovelace.cards.actions.no_entity_toggle"
          ),
        });
        forwardHaptic("failure");
      }
      break;
    }
    case "call-service": {
      if (!actionConfig.service) {
        showToast(node, {
          message: opp.localize("ui.panel.lovelace.cards.actions.no_service"),
        });
        forwardHaptic("failure");
        return;
      }
      const [domain, service] = actionConfig.service.split(".", 2);
      opp.callService(
        domain,
        service,
        actionConfig.service_data,
        actionConfig.target
      );
      forwardHaptic("light");
      break;
    }
    case "fire-dom-event": {
      fireEvent(node, "ll-custom", actionConfig);
    }
  }
};
