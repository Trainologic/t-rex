const buildUtils = require("build-utils/process");
const path = require("path");

Promise.resolve()
    .then(compileTS)
    .then(runSJS);

function compileTS() {
    return buildUtils.exec(path.resolve("node_modules/.bin/tsc"));
}

function runSJS() {
    return buildUtils.exec(path.resolve("node_modules/.bin/sjs"));
}
