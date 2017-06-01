import {config, configure} from "./config";
export interface Logger {
    log(...args);
    error(...args);
    warn(...args);
}

const nullLogger = {
    log: function(){},
    error: function(){},
    warn: function(){},
};

export const enableLogging = function(enable) {
    configure({
        enableLogging: enable
    });
}

export function createLogger(prefix): Logger {
    if(!config.enableLogging) {
        return nullLogger;
    }

    return {
        log: console.log.bind(console, prefix + ">"),
        error: console.error.bind(console, prefix + ">"),
        warn: console.warn.bind(console, prefix + ">"),
    }
}