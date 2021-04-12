import Fuse from "fuse.js";
import { OppioAddonInfo } from "../../../src/data/oppio/addon";

export function filterAndSort(addons: OppioAddonInfo[], filter: string) {
  const options: Fuse.IFuseOptions<OppioAddonInfo> = {
    keys: ["name", "description", "slug"],
    isCaseSensitive: false,
    minMatchCharLength: 2,
    threshold: 0.2,
  };
  const fuse = new Fuse(addons, options);
  return fuse.search(filter).map((result) => result.item);
}
