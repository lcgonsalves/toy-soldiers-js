import {IGraphNode} from "../../lib/graph/GraphInterfaces";
import LocationNode from "../../lib/graph/LocationNode";
import {Coordinate} from "../../lib/geometry/Coordinate";
import * as assert from "assert";

describe("Baseline Node Functionality", function () {

    const a: IGraphNode = new LocationNode("a", 10);
    const b: IGraphNode = new LocationNode("b", 10);
    const c: IGraphNode = new LocationNode("c", 10);

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