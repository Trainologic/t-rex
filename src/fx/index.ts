export {ServiceStore} from "./ServiceStore";
export {AppStore, ActivityListener, StoreMiddleware, StoreMiddlewareNext} from "./AppStore";
export {Activity, transaction, Reaction} from "./decorators";
export {TransactionScope} from "./TransactionScope";
export {configure} from "./config";
export {ActivityScope} from "./ActivityScope";
export {push, dec, inc} from "./operators";

//Logger.root.name = "[t-rex]";