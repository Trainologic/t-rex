const map = new WeakMap();

export function setVersion(obj, version) {
    const metadata = getCreateMetadata(obj);
    metadata.version = version;
}

function getCreateMetadata(obj) {
    let metadata = map.get(obj);
    if(!metadata) {
        metadata = {};
        map.set(obj, metadata);
    }

    return metadata;
}

export function getVersion(obj) {
    const metadata = map.get(obj);
    if(!metadata) {
        return undefined;
    }

    return metadata.version;
}

export function setModified(obj) {
    const metadata = getCreateMetadata(obj);
    metadata.modified = true;
}

export function clearModified(obj) {
    const metadata = getCreateMetadata(obj);
    metadata.modified = false;
}

export function isModified(obj) {
    const metadata = map.get(obj);
    if(!metadata) {
        return undefined;
    }

    return metadata.modified;
}
