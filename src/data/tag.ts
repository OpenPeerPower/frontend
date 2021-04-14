import { OppEventBase } from "openpeerpower-js-websocket";
import { OpenPeerPower } from "../types";

export const EVENT_TAG_SCANNED = "tag_scanned";

export interface TagScannedEvent extends OppEventBase {
  event_type: "tag_scanned";
  data: {
    tag_id: string;
    device_id?: string;
  };
}

export interface Tag {
  id: string;
  name?: string;
  description?: string;
  last_scanned?: string;
}

export interface UpdateTagParams {
  name?: Tag["name"];
  description?: Tag["description"];
}

export const fetchTags = async (opp: OpenPeerPower) =>
  opp.callWS<Tag[]>({
    type: "tag/list",
  });

export const createTag = async (
  opp: OpenPeerPower,
  params: UpdateTagParams,
  tagId?: string
) =>
  opp.callWS<Tag>({
    type: "tag/create",
    tag_id: tagId,
    ...params,
  });

export const updateTag = async (
  opp: OpenPeerPower,
  tagId: string,
  params: UpdateTagParams
) =>
  opp.callWS<Tag>({
    ...params,
    type: "tag/update",
    tag_id: tagId,
  });

export const deleteTag = async (opp: OpenPeerPower, tagId: string) =>
  opp.callWS<void>({
    type: "tag/delete",
    tag_id: tagId,
  });
