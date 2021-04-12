import { OppEntities } from "open-peer-power-js-websocket";
import { GroupEntity } from "../../data/group";

export const getGroupEntities = (
  entities: OppEntities,
  group: GroupEntity
) => {
  const result = {};

  group.attributes.entity_id.forEach((entityId) => {
    const entity = entities[entityId];

    if (entity) {
      result[entity.entity_id] = entity;
    }
  });

  return result;
};
