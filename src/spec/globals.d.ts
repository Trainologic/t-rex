declare namespace jasmine {
    interface Matchers<T> {
        toBeEqualArray(expected);
        toDeeplyEqual(expected);
    }
}
