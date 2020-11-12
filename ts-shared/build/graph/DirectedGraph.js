"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = require("./Node");
const Interval_1 = require("../geometry/Interval");
const Coordinate_1 = require("../geometry/Coordinate");
class DirectedGraph {
    constructor(...nodes) {
        this._nodes = {};
        this._isSnappingNodesToGrid = false;
        nodes.forEach(n => this._nodes[n.id] = n);
    }
    get nodes() { return Object.values(this._nodes); }
    get isSnappingNodesToGrid() { return this._isSnappingNodesToGrid; }
    set isSnappingNodesToGrid(value) { this._isSnappingNodesToGrid = value; }
    get domain() {
        return {
            x: DirectedGraph.xDomain,
            y: DirectedGraph.yDomain
        };
    }
    get step() { return DirectedGraph.step; }
    toString() {
        return this.nodes.map(n => n.toString()).reduce((acc, cur) => acc + "\n" + cur);
    }
    /**
     * Returns true if graph contains a given node.
     *
     * @param n
     */
    contains(n) {
        const node = this.nodes[n.id];
        return node && n.equals(n);
    }
    /**
     * Returns given node if it exists in the graph. If node doesn't
     * exist, an error is thrown.
     *
     * @param n
     */
    get(n) {
        if (this.contains(n))
            return this.nodes[n.id];
        else
            throw new Error("Node is not contained in the graph!");
    }
    /**
     * Returns given node if it exists in the graph. If node doesn't
     * exist, else is returned.
     *
     * @param n
     * @param fallbackValue
     */
    getOrElse(n, fallbackValue) {
        if (!this.contains(n))
            return fallbackValue;
        else
            return this.get(n);
    }
    /**
     * Adds node(s) to the graph if not yet contained. If a node is already contained,
     * this function updates the edges of that node to the new one.
     *
     * @param n
     */
    addNode(...n) {
        n.forEach(node => {
            if (this._isSnappingNodesToGrid) {
                const { x, y } = DirectedGraph.snapToGrid(node.x, node.y);
                node.moveTo(x, y);
            }
            if (!DirectedGraph.xDomain.contains(node.x) || !DirectedGraph.yDomain.contains(node.y))
                throw new Error("Node does not fit in the coordinate system!");
            !this.contains(node) ? this._nodes[node.id] = node : this.findAndUpdateEdges(node);
        });
        return this;
    }
    /**
     * Adds a node to the graph at the input coordinates.
     * @param {number} x
     * @param {number} y
     * @param {string} id optional identifier for the point. if no identifier is passed, one will be generated.
     * @returns {Node} the newly added node
     */
    addNodeAt(x, y, id) {
        const n = new Node_1.default(id, x, y);
        this.addNode(n);
        return n;
    }
    /**
     * For a given node n, if it is already contained by the graph, update its edges.
     * Otherwise, add it to the graph.
     *
     * @param n the node
     */
    findAndUpdateEdges(n) {
        return this.get(n).updateEdges(n);
    }
    /** Helper method to move coordinates in accordance to domain, range and step */
    static snapToGrid(x, y) {
        let snappedX = Math.round(x), snappedY = Math.round(y);
        let remainderX = snappedX % DirectedGraph.step, remainderY = snappedY % DirectedGraph.step;
        // local helpers
        const correctRemainderSign = rem => rem < DirectedGraph.step / 2 ? -rem : DirectedGraph.step - rem;
        function snap(domain, snapped, remainder) {
            if (domain.contains(snapped)) {
                snapped = remainder === 0 ? snapped : snapped + correctRemainderSign(remainder);
            }
            else {
                console.error("out of bounds");
                snapped = snapped > domain.max ?
                    domain.max :
                    domain.min;
            }
            return snapped;
        }
        snappedX = snap(DirectedGraph.xDomain, snappedX, remainderX);
        snappedY = snap(DirectedGraph.yDomain, snappedY, remainderY);
        return new Coordinate_1.Coordinate(snappedX, snappedY);
    }
    /**
     * Adds a pair of nodes to the graph and connects them. If either of the nodes already
     * exists, it will be connected to the other. If both already exist, they will be connected to each other.
     *
     * @param {Node} n1 Starting node if unidirectional
     * @param {Node} n2 Ending node if unidirectional
     * @param {boolean} bidirectional false if unidirectional
     * @returns {Node} the second node, or ending node if unidirectional
     */
    addAndConnect(n1, n2, bidirectional = false) {
        let firstNode, secondNode;
        firstNode = this.getOrElse(n1, n1);
        secondNode = this.getOrElse(n2, n2);
        firstNode.connectTo(secondNode, bidirectional);
        // adds if they don't exist yet
        return this.addNode(firstNode, secondNode);
    }
    /** returns an array of nodes whose position intersects with the given edge */
    getNodesIntersectingWith(edge) {
        return this.nodes.filter(n => (!(n.equals(edge.from) || n.equals(edge.to)) && edge.intersects(n)));
    }
    equals(other) {
        return Object.values(this._nodes).every(other.contains);
    }
}
exports.default = DirectedGraph;
DirectedGraph.xDomain = new Interval_1.Interval(-100, 100);
DirectedGraph.yDomain = new Interval_1.Interval(-100, 100);
DirectedGraph.step = 10;
//# sourceMappingURL=DirectedGraph.js.map