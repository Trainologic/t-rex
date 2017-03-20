import * as objectValues from "object.values";

if(!Object["values"]) {
    objectValues.shim()
}

export function toBeEqualArray(util, customEqualityTesters) {
    return {
        compare: function(actual, expected) {
            const message = run(actual, expected);
            return {
                pass: message ? false : true,
                message
            };
        }
    };
}

function run(actual, expected) {
    if(!Array.isArray(actual)) {
        return "Actual is not an array";
    }

    if(!Array.isArray(expected)) {
        return "Expected is not an array";
    }

    if(actual.length != expected.length) {
        return "Expected is not an array";
    }

    if(!Array.isArray(expected)) {
        return "Expected is not an array";
    }

    for(let i=0; i<actual.length; i++) {
        if(actual[i]!==expected[i]) {
            return "Value at index " + i + " is different";
        }
    }
}
