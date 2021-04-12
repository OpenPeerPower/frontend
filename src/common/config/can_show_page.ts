import { PageNavigation } from "../../layouts/opp-tabs-subpage";
import { OpenPeerPower } from "../../types";
import { isComponentLoaded } from "./is_component_loaded";

export const canShowPage = (opp: OpenPeerPower, page: PageNavigation) => {
  return (
    (isCore(page) || isLoadedIntegration(opp, page)) &&
    !hideAdvancedPage(opp, page)
  );
};

const isLoadedIntegration = (opp: OpenPeerPower, page: PageNavigation) =>
  !page.component || isComponentLoaded(opp, page.component);
const isCore = (page: PageNavigation) => page.core;
const isAdvancedPage = (page: PageNavigation) => page.advancedOnly;
const userWantsAdvanced = (opp: OpenPeerPower) => opp.userData?.showAdvanced;
const hideAdvancedPage = (opp: OpenPeerPower, page: PageNavigation) =>
  isAdvancedPage(page) && !userWantsAdvanced(opp);
