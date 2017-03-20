let enabled = true;

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

// function internalEnableLogging(enable) {
// }

export const enableLogging = function(enable) {
    enabled = enable;
}

export function createLogger(prefix): Logger {
    if(!enabled) {
        return nullLogger;
    }

    return {
        log: console.log.bind(console, prefix + ">"),
        error: console.error.bind(console, prefix + ">"),
        warn: console.warn.bind(console, prefix + ">"),
    }
}