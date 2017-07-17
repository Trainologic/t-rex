import {appLogger} from "./logger";

const logger = appLogger.create("operators");

export abstract class StoreOperator {
    abstract execute(data: any);
}

export class PushOperator extends StoreOperator {
    constructor(private item) {
        super();
    }

    execute(data: any): any {
        logger("PushOperator.execute", data, this.item).log();

        const newData = data.concat([]);
        newData.push(this.item);

        return newData;
    }
}

export class IncrementOperator extends StoreOperator {
    execute(data: any): any {
        logger("IncrementOperator.execute", data).log();

        return data + 1;
    }
}

export class DecrementOperator extends StoreOperator {
    execute(data: any): any {
        logger("DecrementOperator.execute", data).log();

        return data - 1;
    }
}

export function push(item): any {
    return new PushOperator(item);
}

export function dec(): any {
    return new DecrementOperator();
}

export function inc(): any {
    return new IncrementOperator();
}
