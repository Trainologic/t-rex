
export class PushCommand {
    constructor(private item) {
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
    return new PushCommand(item);
}

export function dec(): any {
    return new DecrementCommand();
}

export function inc(): any {
    return new IncrementCommand();
}
