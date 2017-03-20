import {ROOT} from "./TransactionalObject";

export class PathResolver {
    private parts: string[];

    constructor(private path: string) {
        if (this.path == ROOT) {
            this.parts = [];
            return;
        }

        this.parts = this.path.split(".");
    }

    static create(path: string) {
        return new PathResolver(path);
    }

    static resolve(obj, path: string) {
        return new PathResolver(path).get(obj);
    }

    get(obj) {
        if (this.parts.length == 0) {
            return obj;
        }

        let res = obj;
        for (let part of this.parts) {
            res = res[part];
        }

        return res;
    }

    set(obj, val) {
        for(let i=0; i<this.parts.length-1; i++) {
            obj = obj[this.parts[i]];
        }

        obj[this.parts[this.parts.length-1]] = val;
    }
}
