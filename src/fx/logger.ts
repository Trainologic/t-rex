export class Logger {
    private _parent: Logger;
    private _name: string;
    private _id: number|undefined;
    private _enabled: boolean|null;
    private _prefix: string;
    private _loggers: Logger[];
    private _nextId: number;

    public static root: Logger = new Logger(null, "", undefined);

    constructor(parent: Logger, name?: string, id?: number) {
        if(name===undefined && id===undefined) {
            throw new Error("Logger name or id must be defined");
        }

        this._parent = parent;
        this._name = name;
        this._id = id;
        this._enabled = null;
        this._prefix = this.buildPrefix();
        this._loggers = [];
        this._nextId = 1;
    }

    get name() {
        return this._name;
    }

    set name(name) {
        this._name = name;

        this.recalcPrefix();
    }

    get log() {
        if(!this.isEnabled()) {
            return noop;
        }

        return console.log.bind(console, this._prefix);
    }

    get error() {
        if(!this.isEnabled()) {
            return noop;
        }

        return console.error.bind(console, this._prefix);
    }

    get warn() {
        if(!this.isEnabled()) {
            return noop;
        }

        return console.warn.bind(console, this._prefix);
    }

    private isEnabled() {
        let logger: Logger = this;

        while(logger!=null) {
            if(logger._enabled!==null) {
                return logger._enabled;
            }

            logger = logger._parent;
        }

        return true;
    }

    private buildPrefix() {
        const parentPrefix = this._parent ? this._parent.buildPrefix() : "";

        const prefix = parentPrefix + (this._id!==undefined ? `(${this._id})` : ` ${this._name}`);
        return prefix;
    }

    private recalcPrefix() {
        this._prefix = this.buildPrefix();

        for (let child of this._loggers) {
            child.recalcPrefix();
        }
    }

    enable() {
        this._enabled = true;
    }

    disable() {
        this._enabled = false;
    }

    private findChild(name: string) {
        for(let child of this._loggers) {
            if(child._name == name) {
                return child;
            }
        }

        return null;
    }

    createChild(name: string) {
        const logger = new Logger(this, name, undefined);
        this._loggers.push(logger);
        return logger;
    }

    WithId(id?: number) {
        if(id === undefined) {
            id = this._nextId++;
        }

        const logger = new Logger(this, undefined, id);

        this._loggers.push(logger);

        return logger;
    }

    static create(... names: string[]) {
        let parent = this.root;

        for(let name of names) {
            parent = parent.findChild(name) || parent.createChild(name);
        }

        return parent;
    }

    static createWithId(... names: string[]) {
        let parent = this.root;

        for(let name of names) {
            parent = parent.findChild(name) || parent.createChild(name);
        }

        return parent;
    }
}

function noop() {
}
