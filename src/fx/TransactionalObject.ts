import {createLogger} from "./logger";
export const ROOT = "/";
export const $$MODIFIED = "$$txsvc:modified";
export const $$VERSION = "$$txsvc:version";

const logger = createLogger("TransactionalObject");

export class TransactionalObject<StateT> {
    base: StateT;
    current: StateT;
    modified: object[];

    static ROOT: string = ROOT;

    constructor(initialState: StateT) {
        this.base = this.current = initialState;
        this.modified = [];
    }

    commit() {
        for(var obj of this.modified) {
            delete obj[$$MODIFIED];
        }
        this.modified = [];

        this.base = this.current;
    }

    rebase(newBase) {
        const res = this.internalRebase(this.current, this.base, newBase, "/");
        this.current = res;
    }

    private appendPath(path, field) {
        if(path == "/") {
            return "/" + field;
        }

        return path + "/" + field;
    }

    private internalRebase(current, base, newBase, path) {
        if(newBase == base) {
            return current;
        }

        if(newBase[$$VERSION] < base[$$VERSION]) {
            return current;
        }

        let newCurrent = current;
        for(let field in newBase) {
            if(field.startsWith("$$txsvc")) {
                continue;
            }

            if(base[field]===current[field]) {
                //
                //  We hold no change for this field
                //  Any new change is welcomed
                //
                newCurrent = this.setField(current, field, newBase[field])
                continue;
            }

            if(typeof base[field]!=="object") {
                //
                //  There is a local change inside a value type
                //  If newBase has different value than this is a conflict
                //
                if(base[field] != newBase[field]) {
                    const fieldPath = this.appendPath(path, field);
                    console.error("Concurrency error at path \"" + fieldPath + "\".", "base is", base[field], "while latest is", newBase[field]);
                    throw new Error("Concurrency error at " + fieldPath);
                }
            }
            else {
                //
                //  There is a local change inside a reference type
                //  If newBase is older than our data than we are OK
                //
                if(base[field] === newBase[field] || base[field][$$VERSION] > newBase[field][$$VERSION]) {
                    continue;
                }

                //
                //  newBase is same version or bigger
                //  This implies a chance that newBase holds new values that might be conflicting
                //
                const newVal = this.internalRebase(
                    current[field],
                    base[field],
                    newBase[field],
                    (path=="/" ? path + field : path + "/" + field));
                newCurrent = this.setField(current, field, newVal);
            }
        }

        return newCurrent;
    }

    getState() {
        return this.base;
    }

    getNewState() {
        return this.current;
    }

    getProperty(root, path) {
        if (path == ROOT) {
            return root;
        }

        const parts = path.split(".");
        for (let part of parts) {
            root = root[part];
        }

        return root;
    }

    setProperty(path, changes) {
        const pathEntries = this.getPath(this.current, path);
        const lastEntry = pathEntries[pathEntries.length-1];
        const parent = (lastEntry ? lastEntry.parent[lastEntry.field] : this.current);
        let newValue = this.merge(parent, changes);

        for(let i=pathEntries.length-1; i>=0; i--) {
            const entry = pathEntries[i];
            const parent = entry.parent;
            const field = entry.field;

            newValue = this.setField(parent, field, newValue);
        }

        this.current = newValue;
    }

    private setField(parent, field, value) {
        if(parent[field] === value) {
            return parent;
        }

        const newParent = this.clone(parent);
        newParent[field] = value;
        return newParent;
    }

    private getPath(obj, path) {
        const entries: {parent: any, field: string}[] = [];

        if(path == ROOT) {
            return entries;
        }

        let parent = obj;
        const fields = path.split(".");
        for(let field of fields) {
            if(parent===null || parent===undefined) {
                break;
            }

            if(typeof parent != "object") {
                throw new Error("Invalid path: " + path);
            }

            entries.push({parent, field});

            parent = parent[field];
        }

        return entries;
    }

    private clone(obj) {
        if (obj && obj[$$MODIFIED]) {
            //
            //  This object is already a clone
            //  No need to clone again
            //
            return obj;
        }

        const res = Object.assign({}, obj);

        res[$$MODIFIED] = true;
        this.modified.push(res);

        res[$$VERSION] = (res[$$VERSION] || 0) + 1;

        return res;
    }

    private merge(obj, changes) {
        if (obj == changes) {

            return changes;
        }

        if (typeof changes != "object") {
            //
            //  Cannot merge a value into itself
            //
            return changes;
        }

        if (Array.isArray(obj)) {
            //
            //  Cannot merge arrays
            //
            return changes;
        }

        const newObj = this.clone(obj);

        for (let field in changes) {
            if (changes.hasOwnProperty(field)) {
                const newValue = changes[field];
                const oldValue = newObj[field];

                if(oldValue!=newValue) {
                    newObj[field] = newValue;
                }
            }
        }

        return newObj;
    }
}
