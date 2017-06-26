import {createLogger} from "./logger";

const logger = createLogger("operators");

export abstract class StoreOperator {
    abstract execute(data: any);
}

export class PushOperator extends StoreOperator {
    constructor(private item) {
        super();
    }

    execute(data: any): any {
        logger.log("PushOperator.execute", data, this.item);

        const newData = data.concat([]);
        newData.push(this.item);

        return newData;
    }
}

export class IncrementCommand {
    constructor() {
    }
}

export class DecrementCommand {
    constructor() {
    }
}

export function push(item): any {
    return new PushOperator(item);
}

export function dec(): any {
    return new DecrementCommand();
}

export function inc(): any {
    return new IncrementCommand();
}
