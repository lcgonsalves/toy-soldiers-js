import {IGraphNode} from "../../lib/graph/GraphInterfaces";
import LocationNode from "../../lib/graph/LocationNode";
import {Coordinate} from "../../lib/geometry/Coordinate";
import * as assert from "assert";
import {LocationContext} from "../../lib/mechanics/Location";

describe("Baseline Node Functionality", function () {

    const a: IGraphNode = new LocationNode("a");
    const b: IGraphNode = new LocationNode("b");
    const c: IGraphNode = new LocationNode("c");

    const allNodes = [a,b,c];

    // delete all connections and reset coordinates to origin
    beforeEach(function () {

        allNodes.forEach(nodeA => {
           allNodes.forEach(nodeB => {
               nodeA.disconnectFrom(nodeB)
           });

           nodeA.translateToCoord(Coordinate.origin);

        });

    });

    it ("Should correctly connect and disconnect (mono-directional)", function () {

        a.connectTo(b);
        a.connectTo(c);

        // connection
        assert.strictEqual(a.isAdjacent(b), true, "A should be adjacent to B");
        assert.strictEqual(a.isAdjacent(c), true, "A should be adjacent to C");

        // reverse direction
        assert.strictEqual(b.isAdjacent(a), false, "A should NOT be adjacent to B");
        assert.strictEqual(c.isAdjacent(a), false, "A should NOT be adjacent to C");

        // non-connected
        assert.strictEqual(b.isAdjacent(c), false, "B should NOT be adjacent to C");
        assert.strictEqual(c.isAdjacent(b), false, "C should NOT be adjacent to B");

    });

    it ("Should correctly connect and disconnect (bi-directional)", function () {

        a.connectTo(b, true);
        a.connectTo(c, true);

        // connection
        assert.strictEqual(a.isAdjacent(b), true, "A should be adjacent to B");
        assert.strictEqual(a.isAdjacent(c), true, "A should be adjacent to C");

        // reverse direction
        assert.strictEqual(b.isAdjacent(a), true, "A should NOT be adjacent to B");
        assert.strictEqual(c.isAdjacent(a), true, "A should NOT be adjacent to C");

        // non-connected
        assert.strictEqual(b.isAdjacent(c), false, "B should NOT be adjacent to C");
        assert.strictEqual(c.isAdjacent(b), false, "C should NOT be adjacent to B");

    });

    it ("Can be traversed", function () {

        a.connectTo(b);
        b.connectTo(c);

        const canGetToCFromA: boolean =
            a.adjacent.filter(n => n.isAdjacent(c)).length > 0

        assert.strictEqual(canGetToCFromA, true, "Can find C from A");

    });

});

describe("Generic edge implementation with location node", function () {

    const a: LocationNode = new LocationNode("a");
    const b: LocationNode = new LocationNode("b");
    const c: LocationNode = new LocationNode("c");

    a.connectTo(c);

    const ctx = new LocationContext<LocationNode>();

    ctx.add(a, b, c);

    it("should detect that B is intersecting with the edge", function () {

        const edge = a.edges[0]
        const intersectingNodes = ctx.getNodesIntersecting(edge);

        assert.strictEqual(intersectingNodes[0].equals(b), true, `Out of all intersecting nodes (${intersectingNodes}), the one at index 0 is ${intersectingNodes[0]} and should be ${b}`)

    });

})