import {Logger} from "./logger";
import {AppStore} from "./AppStore";

export class ActivityScope {
    private outerZone: Zone;
    private id: number;
    private logger: Logger;

    private static nextActivityId = 0;

    constructor() {
        this.id = ++ActivityScope.nextActivityId;
        this.logger = Logger.create("ActivityScope", Logger.ID);
        this.outerZone = Zone.current;

        this.logger.log("created");
    }

    static current(): ActivityScope {
        let activity: ActivityScope = Zone.current.get("activity");
        return activity;
    }

    static runInsideActivity<StateT>(appStore: AppStore<any>, action) {
        function runAction(func, isRoot: boolean) {
            let retVal;

            try {
                retVal = func();

                if(isRoot) {
                    if(retVal && retVal.catch) {
                        retVal.then(function(res) {
                            appStore._onActivitySuccess(res);
                        }, function(err) {
                            appStore._onActivityError(err);
                        });
                    }
                    else {
                        appStore._onActivitySuccess(retVal);
                    }
                }

                return retVal;
            }
            catch(err) {
                if(isRoot) {
                    appStore._onActivityError(err);
                    return;
                }
                else {
                    throw err;
                }
            }
        }

        let activity: ActivityScope = ActivityScope.current();
        if(activity) {
            //
            //  This is a nested activity
            //  No need to catch errors
            //
            return runAction(action, false);
        }

        //
        //  This is a root activity
        //  Need to monitor for errors and emit event when error has happened
        //
        activity = new ActivityScope();

        const spec: ZoneSpec = {
            name: "activity",
            properties: {
                "activity": activity,
            },
        };

        const zone = Zone.current.fork(spec);
        return zone.run(function () {
            return runAction(action, true);
        });
    }
}
