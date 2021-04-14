import {
  OppEntityAttributeBase,
  OppEntityBase,
} from "openpeerpower-js-websocket";
import { navigate } from "../common/navigate";
import { OpenPeerPower, ServiceCallResponse } from "../types";

export const SCENE_IGNORED_DOMAINS = [
  "sensor",
  "binary_sensor",
  "device_tracker",
  "person",
  "persistent_notification",
  "configuration",
  "image_processing",
  "sun",
  "weather",
  "zone",
];

let inititialSceneEditorData: Partial<SceneConfig> | undefined;

export const showSceneEditor = (
  el: HTMLElement,
  data?: Partial<SceneConfig>
) => {
  inititialSceneEditorData = data;
  navigate(el, "/config/scene/edit/new");
};

export const getSceneEditorInitData = () => {
  const data = inititialSceneEditorData;
  inititialSceneEditorData = undefined;
  return data;
};

export interface SceneEntity extends OppEntityBase {
  attributes: OppEntityAttributeBase & { id?: string };
}

export interface SceneConfig {
  name: string;
  icon?: string;
  entities: SceneEntities;
}

export interface SceneEntities {
  [entityId: string]: string | { state: string; [key: string]: any };
}

export const activateScene = (
  opp: OpenPeerPower,
  entityId: string
): Promise<ServiceCallResponse> =>
  opp.callService("scene", "turn_on", { entity_id: entityId });

export const applyScene = (
  opp: OpenPeerPower,
  entities: SceneEntities
): Promise<ServiceCallResponse> =>
  opp.callService("scene", "apply", { entities });

export const getSceneConfig = (
  opp: OpenPeerPower,
  sceneId: string
): Promise<SceneConfig> =>
  opp.callApi<SceneConfig>("GET", `config/scene/config/${sceneId}`);

export const saveScene = (
  opp: OpenPeerPower,
  sceneId: string,
  config: SceneConfig
) => opp.callApi("POST", `config/scene/config/${sceneId}`, config);

export const deleteScene = (opp: OpenPeerPower, id: string) =>
  opp.callApi("DELETE", `config/scene/config/${id}`);
