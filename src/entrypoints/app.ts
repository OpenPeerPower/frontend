import { setPassiveTouchGestures } from "@polymer/polymer/lib/utils/settings";
import "../layouts/open-peer-power";
import "../resources/op-style";
import "../resources/roboto";
import "../util/legacy-support";

setPassiveTouchGestures(true);

(window as any).frontendVersion = __VERSION__;
