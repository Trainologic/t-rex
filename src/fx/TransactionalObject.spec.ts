import {TransactionalObject} from "./TransactionalObject";
import {collectValues} from "../spec/collectValues";
import {toBeEqualArray} from "../spec/toBeEqualArray";
import {toDeeplyEqual} from "../spec/toDeeplyEqual";

describe("TransactionalObject", function() {
    beforeEach(function() {
        jasmine.addMatchers({
            toBeEqualArray: toBeEqualArray,
            toDeeplyEqual: toDeeplyEqual
        });
    });

    it(`does not change original object`, function() {
        const state = {
            id:1,
            name: "Ori",
            nested: {
                id:2
            }
        };
        const objectsBefore = collectValues(state);
        const tx = new TransactionalObject(state);

        tx.setProperty(TransactionalObject.ROOT, {id:2});
        tx.setProperty("nested", {name:"Ori"});
        tx.commit();

        const objectsAfter = collectValues(state);
        expect(objectsAfter).toBeEqualArray(objectsBefore);
    });

    it(`commit changes correctly when using ${TransactionalObject.ROOT} path`, function() {
        const tx = new TransactionalObject({
            id:1,
            name: "Ori"
        });

        tx.setProperty(TransactionalObject.ROOT, {id:2});
        tx.commit();

        expect(tx.getBase()).toDeeplyEqual({id:2, name: "Ori"});
    });

    it(`Reuses the newState object when running multiple updates`, function() {
        const tx = new TransactionalObject({
            id:1,
            name: "Ori"
        });

        tx.setProperty(TransactionalObject.ROOT, {id:2});
        const obj1 = tx.getCurrent();

        tx.setProperty(TransactionalObject.ROOT, {id:3});
        const obj2 = tx.getCurrent();

        expect(obj1).toEqual(obj2);
    });

    describe("deep update", function() {
        let state;
        let tx: TransactionalObject<any>;

        beforeEach(function() {
            state = {
                id:1,
                nested: {
                    id: 2,
                    nested: {
                        id: 3,
                        nested: {
                            id: 4,
                        }
                    }
                }
            };
            tx = new TransactionalObject(state);
        });

        it(`commit changes correctly`, function() {
            tx.setProperty("nested.nested.nested", {name:"Ori"});
            tx.commit();

            expect(tx.getCurrent()).toDeeplyEqual({
                id:1,
                nested: {
                    id: 2,
                    nested: {
                        id: 3,
                        nested: {
                            id: 4,
                            name: "Ori"
                        }
                    }
                }
            });
        });

        it(`clones all parents of the merged object`, function() {
            tx.setProperty("nested.nested.nested", {name:"Ori"});
            tx.commit();

            const newState = tx.getCurrent();
            expect(state == newState).toBeFalsy();
            expect(state.nested == newState.nested).toBeFalsy();
            expect(state.nested.nested == newState.nested.nested).toBeFalsy();
            expect(state.nested.nested.nested == newState.nested.nested.nested).toBeFalsy();
        });
    });

});
