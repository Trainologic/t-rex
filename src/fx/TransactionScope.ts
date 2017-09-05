import {AppStore} from "./AppStore";
import {TransactionalObject} from "./TransactionalObject";
import {ActivityScope} from "./ActivityScope";
import {appLogger} from "./logger";
import {config} from "./config";

if(typeof Zone === "undefined") {
    throw new Error("t-rex cannot execute without zone.js. Please ensure zone.js is loaded before t-rex");
}

const logger = appLogger.create("TransactionScope");

export class TransactionScope {
    private appStore: AppStore<any>;
    private tranState: TransactionalObject<any>;
    private committed: boolean;
    private id: number;
    private updateCount: number;
    private oldState: any;

    private static nextTranId = 0;
    private static trans: TransactionScope[] = [];

    constructor(appStore: AppStore<any>) {
        this.id = ++TransactionScope.nextTranId;
        this.updateCount = 0;
        this.appStore = appStore;
        this.oldState = appStore.getState();
        this.tranState = new TransactionalObject(this.oldState);
        this.committed = false;

        logger("created", this.oldState).log();
    }

    public update(path: string, changes: any) {
        logger(`update(${++this.updateCount})`, path, changes).log();

        this.ensureNotCommitted();

        const newState = this.tranState.setProperty(path, changes);

        if(newState != this.oldState) {
            logger("newState", newState).log();
        }
        else {
            logger("No effective changes").log();
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
            logger("Nothing new to commit. updateCount is", this.updateCount).log();
            return;
        }

        if(!config.allowConcurrencyErrors && oldState != currentState) {
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

        //
        //  Committing to appStore causes emitting of change event
        //  Subscribers must be notified outside of the transaction zone, else, any
        //  additional update will be considered as part of the already committed transaction
        //  and therefore will throw error
        //
        this.appStore.emit(oldState, newState);

        //
        //  Cleans management flags + switch between old and new
        //
        this.tranState.commit();

        logger("committed").log();
    }

    static current(): TransactionScope {
        const trans = TransactionScope.trans;
        if(!trans.length) {
            return null;
        }

        const tran = trans[trans.length-1];
        return tran;
    }

    static runInsideTransaction<StateT>(appStore: AppStore<any>, action) {
        let tran: TransactionScope = TransactionScope.current();
        if(tran) {
            tran.ensureNotCommitted();

            return action();
        }

        tran = new TransactionScope(appStore);

        TransactionScope.trans.push(tran);

        try {
            const retVal = action();

            tran.commit();

            return retVal;
        }
        finally {
            TransactionScope.trans.pop();
        }
    }

    private ensureNotCommitted() {
        if(this.committed) {
            throw new Error("Activity was already committed");
        }
    }
}
