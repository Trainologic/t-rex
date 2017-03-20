export function P1
<
    T,
    K1 extends keyof T
    >(obj: T, key1: K1) {
    if(!obj) {
        return undefined;
    }

    return obj[key1];  // Inferred type is T[K]
}

export function E1
<
    T,
    K1 extends keyof T
    >(obj1: T, obj2: T, key1: K1) {
    if(obj1==obj2) {
        return true;
    }

    return P1(obj1, key1) == P1(obj2, key1);
}

export function P2
<
    T,
    K1 extends keyof T,
    K2 extends keyof T[K1]
    >
(obj: T, key1: K1, key2: K2) {
    return P1(P1(obj, key1), key2);
}

export function E2
<
    T,
    K1 extends keyof T,
    K2 extends keyof T[K1]
    >(obj1: T, obj2: T, key1: K1, key2: K2) {
    if(obj1==obj2) {
        return true;
    }

    return P2(obj1, key1, key2) == P2(obj2, key1, key2);
}

export function P3
<
    T,
    K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2]
    >
(obj: T, key1: K1, key2: K2, key3: K3) {
    return P1(P1(P1(obj, key1), key2), key3);
}

export function promisify(value) {
    if(value && value.then) {
        return value;
    }

    return Promise.resolve(value);
}

// export const promisify = (function() {
//     if(typeof window != "undefined" && window.hasOwnProperty("angular")) {
//         const angular = window["angular"];
//         let injector;
//         let $q;
//
//         return function promisifyOnAngular1(value) {
//             injector = injector || angular.element(document.getElementsByTagName("body")).injector();
//             $q = $q || injector.get("$q");
//
//             if(value && value.then) {
//                 return value;
//             }
//             return $q.when(value);
//         }
//     }
//     else {
//         return function promisifyOnNonAngular1(value) {
//             if(value && value.then) {
//                 return value;
//             }
//
//             return Promise.resolve(value);
//         }
//     }
// })();
//
