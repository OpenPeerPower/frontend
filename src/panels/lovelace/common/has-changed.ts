import { PropertyValues } from "lit-element";
import { OpenPeerPower } from "../../../types";
import { processConfigEntities } from "./process-config-entities";

function hasConfigChanged(element: any, changedProps: PropertyValues): boolean {
  if (changedProps.has("_config")) {
    return true;
  }

  const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
  if (!oldOpp) {
    return true;
  }

  if (
    oldOpp.connected !== element.opp!.connected ||
    oldOpp.themes !== element.opp!.themes ||
    oldOpp.locale !== element.opp!.locale ||
    oldOpp.localize !== element.opp.localize ||
    oldOpp.config.state !== element.opp.config.state
  ) {
    return true;
  }
  return false;
}

// Check if config or Entity changed
export function hasConfigOrEntityChanged(
  element: any,
  changedProps: PropertyValues
): boolean {
  if (hasConfigChanged(element, changedProps)) {
    return true;
  }

  const oldOpp = changedProps.get("opp") as OpenPeerPower;

  return (
    oldOpp.states[element._config!.entity] !==
    element.opp!.states[element._config!.entity]
  );
}

// Check if config or Entities changed
export function hasConfigOrEntitiesChanged(
  element: any,
  changedProps: PropertyValues
): boolean {
  if (hasConfigChanged(element, changedProps)) {
    return true;
  }

  const oldOpp = changedProps.get("opp") as OpenPeerPower;

  const entities = processConfigEntities(element._config!.entities);

  return entities.some(
    (entity) =>
      "entity" in entity &&
      oldOpp.states[entity.entity] !== element.opp!.states[entity.entity]
  );
}
