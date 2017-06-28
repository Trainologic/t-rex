import {config} from "./config";
const loggers = [];

export interface Logger {
    log(...args);
    error(...args);
    warn(...args);
}

export class Logger {
    constructor(public prefix: string) {
    }

    log() {}

    error() {}

    warn() {}
}

// const nullLogger = {
//     log: function(){},
//     error: function(){},
//     warn: function(){},
// };

export const enableLogging = function(enable) {
    for(let logger of loggers) {
        enableLogger(logger, enable);
    }

    // configure({
    //     enableLogging: enable
    // });
}

function noop() {
}

function enableLogger(logger, enable) {
    if(enable) {
        logger.log = console.log.bind(console, "[t-rex] " + logger.prefix + ">");
        logger.error = console.error.bind(console, "[t-rex] " + logger.prefix + ">");
        logger.warn = console.warn.bind(console, "[t-rex] " + logger.prefix + ">");
    }
    else {
        logger.log = noop;
        logger.error = noop;
        logger.warn = noop;
    }
}

export function createLogger(prefix): Logger {
    const logger = new Logger(prefix);
    loggers.push(logger);

    if(config.enableLogging) {
        enableLogger(logger, true);
    }

    return logger;
}