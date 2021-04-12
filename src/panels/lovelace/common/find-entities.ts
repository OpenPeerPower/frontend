import { OppEntity } from "open-peer-power-js-websocket";
import { computeDomain } from "../../../common/entity/compute_domain";
import { OpenPeerPower } from "../../../types";

const arrayFilter = (
  array: any[],
  conditions: Array<(value: any) => boolean>,
  maxSize: number
) => {
  if (!maxSize || maxSize > array.length) {
    maxSize = array.length;
  }

  const filteredArray: any[] = [];

  for (let i = 0; i < array.length && filteredArray.length < maxSize; i++) {
    let meetsConditions = true;

    for (const condition of conditions) {
      if (!condition(array[i])) {
        meetsConditions = false;
        break;
      }
    }

    if (meetsConditions) {
      filteredArray.push(array[i]);
    }
  }

  return filteredArray;
};

export const findEntities = (
  opp: OpenPeerPower,
  maxEntities: number,
  entities: string[],
  entitiesFallback: string[],
  includeDomains?: string[],
  entityFilter?: (stateObj: OppEntity) => boolean
) => {
  const conditions: Array<(value: string) => boolean> = [];

  if (includeDomains?.length) {
    conditions.push((eid) => includeDomains!.includes(computeDomain(eid)));
  }

  if (entityFilter) {
    conditions.push(
      (eid) => opp.states[eid] && entityFilter(opp.states[eid])
    );
  }

  const entityIds = arrayFilter(entities, conditions, maxEntities);

  if (entityIds.length < maxEntities && entitiesFallback.length) {
    const fallbackEntityIds = findEntities(
      opp,
      maxEntities - entityIds.length,
      entitiesFallback,
      [],
      includeDomains,
      entityFilter
    );

    entityIds.push(...fallbackEntityIds);
  }

  return entityIds;
};
