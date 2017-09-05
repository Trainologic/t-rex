import * as objectValues from "object.values";

if(!Object["values"]) {
    objectValues.shim()
}

export function toDeeplyEqual(util, customEqualityTesters) {
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
    for (let key of Object.keys(actual)) {
        if (key.startsWith("$$t-rex") || key.startsWith("$$system")) {
            continue;
        }

        if (!expected.hasOwnProperty(key)) {
            return "Actual object has an unexpected property \"" + key + "\"";
        }
    }

    for (let key of Object.keys(expected)) {
        if (key.startsWith("$$t-rex") || key.startsWith("$$system")) {
            continue;
        }

        if (!actual.hasOwnProperty(key)) {
            return "Actual object is missing property \"" + key + "\"";
        }
    }

    for (let key in Object.keys(expected)) {
        if (key.startsWith("$$t-rex") || key.startsWith("$$system")) {
            continue;
        }

        let expectedVal = expected[key];
        let actualVal = actual[key];

        let expectedType = typeof expectedVal;
        let actualType = typeof actualVal;

        if (expectedType != actualType) {
            return "Actual property \"" + key + "\" is of type " + actualType + " while expected is " + expectedType;
        }

        if (expectedType == "function") {
            return "Cannot compare objects with functions";
        }

        if (expectedVal === actualVal) {
            continue;
        }

        if (expectedType == "object") {
            const err = run(actualVal, expectedType);
            if (err)
                return err;
        }
        else {
            return "Actual property \"" + key + "\" has value \"" + actualVal + " while expected is \"" + expectedVal + "\"";
        }
    }
}