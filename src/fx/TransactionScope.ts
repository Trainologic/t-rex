import {AppStore} from "./AppStore";
import {TransactionalObject} from "./TransactionalObject";
import {ActivityScope} from "./ActivityScope";
import {appLogger} from "./logger";
import {ILogger} from "complog/logger";

if(typeof Zone === "undefined") {
    throw new Error("t-rex cannot execute without zone.js. Please ensure zone.js is loaded before t-rex");
}

export class TransactionScope {
    private appStore: AppStore<any>;
    private tranState: TransactionalObject<any>;
    private committed: boolean;
    private outerZone: Zone;
    private id: number;
    private logger: ILogger;
    private updateCount: number;
    private oldState: any;

    private static nextTranId = 0;

    constructor(appStore: AppStore<any>) {
        this.id = ++TransactionScope.nextTranId;
        this.logger = appLogger.create("TransactionScope").create(this.id);
        this.updateCount = 0;
        this.appStore = appStore;
        this.oldState = appStore.getState();
        this.tranState = new TransactionalObject(this.oldState);
        this.committed = false;
        this.outerZone = Zone.current;

        this.logger("created", this.oldState).log();
    }

    public update(path: string, changes: any) {
        this.logger(`update(${++this.updateCount})`, path, changes).log();

        this.ensureNotCommitted();

        const newState = this.tranState.setProperty(path, changes);

        if(newState != this.oldState) {
            this.logger("newState", newState).log();
        }
        else {
            this.logger("No effective changes").log();
        }
    }

    public getNewState() {
        return this.tranState.getCurrent();
    }

    public getOldState() {
        return this.tranState.getBase();
    }

    public commit() {
        this.ensureNotCommitted();

        let oldState = this.tranState.getBase();
        let newState = this.tranState.getCurrent();
        const currentState = this.appStore.getState();

        if(newState == currentState) {
            this.logger("Nothing new to commit. updateCount is", this.updateCount).log();
            return;
        }

        if(oldState != currentState) {
            //
            //  A parallel transaction has already modified the main store before us
            //  We only allow parallel changes at different branches. Else, "Concurrency error is raised"
            //
            this.tranState.rebase(currentState);

            oldState = this.tranState.getBase();
            newState = this.tranState.getCurrent();
        }

        this.appStore.executeReactions();

        this.appStore.commit(oldState, newState);

        const activity = ActivityScope.current();
        if(activity) {
            activity.onTransactionCommitted();
        }

        this.committed = true;

        this.outerZone.run(()=> {
            //
            //  Committing to appStore causes emitting of change event
            //  Subscribers must be notified outside of the transaction zone, else, any
            //  additional update will be considered as part of the already committed transaction
            //  and therefore will throw error
            //
            this.appStore.emit(oldState, newState);
        });

        //
        //  Cleans management flags + switch between old and new
        //
        this.tranState.commit();

        this.logger("committed").log();
    }

    static current(): TransactionScope {
        let tran: TransactionScope = Zone.current.get("tran");
        return tran;
    }

    static runInsideTransaction<StateT>(appStore: AppStore<any>, action) {
        function runAction(func, commit) {
            var retVal = func();
            if(retVal && retVal.then) {
                const promise = retVal;
                return promise.then(res => {
                    if(commit) {
                        tran.commit();
                    }

                    return res;
                });
            }
            else {
                if(commit) {
                    tran.commit();
                }

                return retVal;
            }
        }

        let tran: TransactionScope = TransactionScope.current();
        if(tran) {
            tran.ensureNotCommitted();

            //
            //  This is a nested transaction
            //  No need to commit changes to app base
            //
            return runAction(action, false);
        }

        //
        //  This is a root transaction
        //  When completed need to commit to the appStore
        //
        tran = new TransactionScope(appStore);

        const spec: ZoneSpec = {
            name: "tran",
            properties: {
                "tran": tran,
            },
        };

        const zone = Zone.current.fork(spec);
        return zone.run(function () {
            var tran1 = TransactionScope.current();
            return runAction(action, true);
        });
    }

    private ensureNotCommitted() {
        if(this.committed) {
            throw new Error("Activity was already committed");
        }
    }
}
