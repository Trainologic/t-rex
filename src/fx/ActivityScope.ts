import {Logger} from "./logger";
import {AppStore} from "./AppStore";

const COUNTERS = ["XMLHttpRequest.send", "setTimeout", "setInterval"];

export class ActivityScope {
    private outerZone: Zone;
    private id: number;
    private logger: Logger;
    private counters: {[name: string]: number};
    private startTime: Date;
    private endTime: Date;
    private endTimeAsync: Date;
    private endTimeZone: Date;
    private result: any;
    private trans: number;

    private static nextActivityId = 0;

    constructor(private appStore, private name) {
        this.id = ++ActivityScope.nextActivityId;
        this.logger = Logger.create("ActivityScope").WithId();
        this.outerZone = Zone.current;
        this.counters = {};
        this.trans = 0;
    }

    static current(): ActivityScope {
        let activity: ActivityScope = Zone.current.get("activity");
        return activity;
    }

    static runInsideActivity<StateT>(appStore: AppStore<any>, name, action) {
        function runAction(func, isRoot: boolean, activity: ActivityScope) {
            let retVal;

            try {
                retVal = func();

                if(isRoot) {
                    if(retVal && retVal.catch) {
                        activity.onSyncComplete();

                        retVal.then(function(res) {
                            activity.onSuccess(res);
                            activity.onAsyncComplete();
                        }, function(err) {
                            activity.onError(err);
                            activity.onAsyncComplete();
                        });
                    }
                    else {
                        activity.onSuccess(retVal);
                        activity.onSyncComplete();
                    }
                }

                return retVal;
            }
            catch(err) {
                if(isRoot) {
                    activity.onError(err);
                    activity.onSyncComplete();
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
            return runAction(action, false, activity);
        }

        //
        //  This is a root activity
        //  Need to monitor for errors and emit event when error has happened
        //
        activity = new ActivityScope(appStore, name);

        const spec: ZoneSpec = {
            name: "activity",
            properties: {
                "activity": activity,
            },
            onScheduleTask: function(parentZoneDelegate, currentZone, targetZone, task) {
                const activityScope: ActivityScope = currentZone.get("activity");
                activityScope.onScheduleTask(task.source);

                return parentZoneDelegate.scheduleTask(targetZone, task);
            },
            onHasTask: function (parentZoneDelegate, currentZone, targetZone, hasTaskState) {
                if(!hasTaskState.macroTask && !hasTaskState.microTask) {
                    const activityScope: ActivityScope = currentZone.get("activity");
                    activityScope.onZoneComplete();
                }
            }
        };

        const zone = Zone.current.fork(spec);
        return zone.run(function () {
            activity.onBegin();

            return runAction(action, true, activity);
        });
    }

    onScheduleTask(source: string) {
        this.updateCounter(source);
    }

    private updateCounter(name: string) {
        if(COUNTERS.indexOf(name)==-1) {
            return;
        }

        let counter = this.counters[name];
        if(counter === undefined) {
            counter = 0;
        }

        ++counter;

        this.counters[name] = counter;
    }

    onBegin() {
        this.logger.log("onBegin", this.name);

        this.startTime = new Date();

        this.appStore._onActivityBegin(this);
    }

    onSuccess(res) {
        this.logger.log("onSuccess", this.name, res);

        this.result = res;
        this.appStore._onActivitySuccess(this, res);
    }

    onError(err) {
        this.logger.log("onError", err);

        this.appStore._onActivityError(this, err);
    }

    onSyncComplete() {
        this.logger.log("onComplete", this.name, this.getStats());

        this.endTime = new Date();

        this.appStore._onActivitySyncComplete(this);
    }

    onAsyncComplete() {
        this.logger.log("onAsyncComplete", this.name, this.getStats());

        this.endTimeAsync = new Date();

        this.appStore._onActivityAsyncComplete(this);
    }

    onZoneComplete() {
        if(this.endTimeZone!==undefined) {
            return;
        }

        this.endTimeZone = new Date();

        this.logger.log("onZoneComplete", this.name, this.getStats());

        this.appStore._onActivityZoneComplete(this);
    }

    onTransactionCommitted() {
        ++this.trans;
    }

    getStats() {
        return {
            result: this.result,
            time: (<any>this.endTime - <any>this.startTime),
            promiseTime: (<any>this.endTimeAsync - <any>this.startTime),
            zoneTime: (<any>this.endTimeZone - <any>this.startTime),
            trans: this.trans,
            counters: this.counters,
        };
    }
}
