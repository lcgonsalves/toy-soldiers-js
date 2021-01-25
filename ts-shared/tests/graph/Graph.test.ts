import {IGraph, IGraphNode} from "../../lib/graph/GraphInterfaces";
import SimpleDirectedGraph from "../../lib/graph/SimpleDirectedGraph";
import LocationNode from "../../lib/graph/LocationNode";
import * as assert from "assert";
import {Coordinate} from "../../lib/geometry/Coordinate";

describe("Graph Implementation", function () {

    const defaultNodePositions = {
       na: new Coordinate(10, 10),
       nb: new Coordinate(20, 10)
    };


    const g: IGraph<IGraphNode> = new SimpleDirectedGraph();
    const na: IGraphNode = new LocationNode("node a", 35, defaultNodePositions.na.x, defaultNodePositions.na.y);
    const nb: IGraphNode = new LocationNode("node b", 35, defaultNodePositions.nb.x, defaultNodePositions.nb.y);

    beforeEach(function () {

        g.rm(na.id);
        g.rm(nb.id);

        na.translateToCoord(defaultNodePositions.na);
        nb.translateToCoord(defaultNodePositions.nb);

    });

    it("Should add and remove one node at a time", function () {

        g.add(na);

        assert.strictEqual(g.contains(na.id), true, "Should _.contains() predicate.");
        assert.strictEqual(g.get(na.id).equals(na), true, "Should fetch the correct item.");

        g.rm(na.id);

        assert.strictEqual(g.get(na.id), undefined, "Should be removed after removal command.")


    });

    it("Should add and remove many nodes a time", function () {

        g.add(na, nb);

        assert.strictEqual(g.contains(na.id), true, "Should _.contains() predicate (A).");
        assert.strictEqual(g.contains(nb.id), true, "Should _.contains() predicate (B).");
        assert.strictEqual(g.get(na.id).equals(na), true, "Should fetch the correct item (A).");
        assert.strictEqual(g.get(nb.id).equals(nb), true, "Should fetch the correct item (B).");

        g.rm(na.id, nb.id);

        assert.strictEqual(g.get(na.id), undefined, "Should be removed after removal command (A).")
        assert.strictEqual(g.get(nb.id), undefined, "Should be removed after removal command (B).")


    });

    it("Location-based contains should work.", function () {

        g.add(na, nb);

        // contains
        assert.strictEqual(g.containsNodeAtLocation(defaultNodePositions.na), true, "Contains node at position.");

        assert.strictEqual(g.containsNodesInVicinity(
            new Coordinate(defaultNodePositions.na.x - 5, defaultNodePositions.na.y - 5),
            15
        ), true, "Contains node at vicinity (5 units away, 15 unit radius).");

        assert.strictEqual(g.containsNodesInVicinity(
            defaultNodePositions.na,
            5
        ), true, "Contains node at vicinity (exact position).");


    });

    it("Location based getters should work.", function () {

        g.add(na, nb);

        // gets
        assert.strictEqual(
            g.getNodesAtPosition(defaultNodePositions.na).indexOf(na) >= 0,
            true,
            `Gets node at ${defaultNodePositions.na} should yield ${na} but instead yielded ${g.getNodesAtPosition(defaultNodePositions.na)}`
        );

        assert.strictEqual(
            g.getNodesAtPosition(defaultNodePositions.na).indexOf(nb) >= 0,
            false,
            `Gets node at ${defaultNodePositions.na} should not yield ${nb}. The function returned ${g.getNodesAtPosition(defaultNodePositions.na)}`
        );

        // gets with radius
        assert.strictEqual(
            g.getNodesInVicinity(defaultNodePositions.na, defaultNodePositions.nb.distance(defaultNodePositions.na) + 5).filter(_ => _.id === na.id || _.id === nb.id).length === 2,
            true,
            "Should find both nodes in the vicinity of A, radius 15 (5 larger)"
        );

        assert.strictEqual(
            g.getNodesInVicinity(defaultNodePositions.na, defaultNodePositions.nb.distance(defaultNodePositions.na)).filter(_ => _.id === na.id || _.id === nb.id).length === 2,
            true,
            "Should find both nodes in the vicinity of A, radius 10 (exact distance)"
        );

        assert.strictEqual(
            g.getNodesInVicinity(defaultNodePositions.na, defaultNodePositions.nb.distance(defaultNodePositions.na) - 5).filter(_ => _.id === na.id || _.id === nb.id).length === 1,
            true,
            "Should find just node A in the vicinity of A, radius 5 (too small)"
        );

    });


});