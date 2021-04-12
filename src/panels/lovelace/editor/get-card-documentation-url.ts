import {
  CUSTOM_TYPE_PREFIX,
  getCustomCardEntry,
} from "../../../data/lovelace_custom_cards";
import { OpenPeerPower } from "../../../types";
import { documentationUrl } from "../../../util/documentation-url";

export const getCardDocumentationURL = (
  opp: OpenPeerPower,
  type: string
): string | undefined => {
  if (type.startsWith(CUSTOM_TYPE_PREFIX)) {
    return getCustomCardEntry(type)?.documentationURL;
  }

  return `${documentationUrl(opp, "/lovelace/")}${type}`;
};
