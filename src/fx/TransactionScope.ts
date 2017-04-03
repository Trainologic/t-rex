import {AppStore} from "./AppStore";
import {TransactionalObject} from "./TransactionalObject";
import {createLogger, Logger} from "./logger";

if(typeof Zone === "undefined") {
    throw new Error("t-rex cannot execute without zone.js. Please ensure zone.js is loaded before txsvc");
}

export class TransactionScope {
    private appStore: AppStore<any>;
    private tranState: TransactionalObject<any>;
    private committed: boolean;
    private outerZone: Zone;
    private id: number;
    private logger: Logger;
    private updateCount: number;

    private static nextTranId = 0;

    constructor(appStore: AppStore<any>) {
        this.id = ++TransactionScope.nextTranId;
        this.logger = createLogger("TransactionScope(" + this.id + ")");
        this.updateCount = 0;
        this.appStore = appStore;
        this.tranState = new TransactionalObject(appStore.getState());
        this.committed = false;
        this.outerZone = Zone.current;

        this.logger.log("created");
    }

    public update(path: string, changes: any) {
        ++this.updateCount;
        this.logger.log("update", path, changes);

        this.ensureNotCommitted();

        this.tranState.setProperty(path, changes);
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
            this.logger.log("Nothing new to commit. updateCount is", this.updateCount);
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

        this.committed = true;

        this.outerZone.run(()=> {
            //
            //  Committing to appStore causes emitting of change event
            //  Subscribers must be notified outside of the transaction zone, else, any
            //  additional update will be considered as part of the already committed transaction
            //  and therefore will throw error
            //
            this.appStore.commit(oldState, newState);
        });

        //
        //  Cleans management flags + switch between old and new
        //
        this.tranState.commit();

        this.logger.log("committed");
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
