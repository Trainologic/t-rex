import {PathResolver} from "./PathResolver";

describe("PathResolver", function() {
    let obj;

    beforeEach(function() {
        obj = {
            id:1,
            child: {
                id:2,
                name: "Ori"
            }
        }
    });

    it("Returns the right value", async function() {
        const resolver = new PathResolver("child.name");

        const val = resolver.get(obj);

        expect(val).toBe("Ori");
    });

    it("Set the value at deep path", async function() {
        const resolver = new PathResolver("child.name");

        resolver.set(obj, "Roni");

        expect(obj.child.name).toBe("Roni");
    });
});
