export function collectValues(root) {
    const res = [];
    const seen = new Set<object>();

    internalCollectValues(root, res, seen);

    return res;
}

function internalCollectValues(root, res, seen: Set<object>) {
    if(seen.has(root)) {
        return;
    }

    res.push(root);
    seen.add(root);

    if(Array.isArray(root)) {
        for(let val of root) {
            internalCollectValues(val, res, seen);
        }
    }
    else if(root && typeof root == "object") {
        for(let val of Object["values"](root)) {
            internalCollectValues(val, res, seen);
        }
    }
}

