import {AppStore} from "./AppStore";
import {Logger} from "complog/logger";
import {appLogger} from "./logger";

const COUNTERS = ["XMLHttpRequest.send", "setTimeout", "setInterval"];

const logger = appLogger.create("ActivityScope");

export class ActivityScope {
    private outerZone: Zone;
    private id: number;
    private counters: {[name: string]: number};
    private startTime: Date;
    private endTime: Date;
    private endTimeAsync: Date;
    private endTimeZone: Date;
    private result: any;
    private trans: number;

    private static nextActivityId = 0;

    constructor(private appStore: AppStore<any>, private name) {
        this.id = ++ActivityScope.nextActivityId;
        this.outerZone = Zone.current;
        this.counters = {};
        this.trans = 0;
    }

    static current(): ActivityScope {
        let activity: ActivityScope = Zone.current.get("activity");
        return activity;
    }

    static runInsideActivity<StateT>(appStore: AppStore<any>, name, action) {
        logger("runInsideActivity", name).log();

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
                }

                throw err;
            }
        }

        let activity: ActivityScope = ActivityScope.current();
        if(activity) {
            logger("Nested activity. Parent is", activity).log();

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

            return activity.run(function() {
                return runAction(action, true, activity);
            });
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
        logger("onBegin", this.name).log();

        this.startTime = new Date();

        this.appStore._onActivityBegin(this);
    }

    run(func: () => any) {
        return this.appStore._runActivity(this, func);
    }

    onSuccess(res) {
        logger("onSuccess", this.name, res).log();

        this.result = res;
        this.appStore._onActivitySuccess(this, res);
    }

    onError(err) {
        logger("onError", err).log();

        this.appStore._onActivityError(this, err);
    }

    onSyncComplete() {
        logger("onComplete", this.name, this.getStats()).log();

        this.endTime = new Date();

        this.appStore._onActivitySyncComplete(this);
    }

    onAsyncComplete() {
        logger("onAsyncComplete", this.name, this.getStats()).log();

        this.endTimeAsync = new Date();

        this.appStore._onActivityAsyncComplete(this);
    }

    onZoneComplete() {
        if(this.endTimeZone!==undefined) {
            return;
        }

        this.endTimeZone = new Date();

        logger("onZoneComplete", this.name, this.getStats()).log();

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
