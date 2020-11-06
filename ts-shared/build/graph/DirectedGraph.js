"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DirectedGraph {
    constructor(...nodes) {
        this.domain = [0, 100];
        this._nodes = [...nodes];
    }
    get nodes() { return this._nodes; }
    toString() {
        return this._nodes.map(n => n.toString()).reduce((acc, cur) => acc + "\n" + cur);
    }
    /**
     * Returns true if graph contains a given node.
     *
     * @param n
     */
    contains(n) {
        return !!this._nodes.find(_ => _.equals(n));
    }
    /**
     * Returns given node if it exists in the graph. If node doesn't
     * exist, an error is thrown.
     *
     * @param n
     */
    get(n) {
        const outputNode = this._nodes.find(_ => _.equals(n));
        if (!outputNode)
            throw new Error("Cannot get node that is not part of the graph.");
        else
            return outputNode;
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
        n.forEach(node => !this.contains(node) ? this._nodes.push(node) : this.findAndUpdateEdges(node));
        return this;
    }
    /**
     * Given a set of coordinates
     * @param x
     * @param y
     * @param id
     */
    addNodeAt(x, y, id = "") {
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
        // TODO: rethink node addition
        if (n1.x > this.domain[1] ||
            n1.x < this.domain[0] ||
            n1.y > this.domain[1] ||
            n1.y < this.domain[0] ||
            n2.x > this.domain[1] ||
            n2.x < this.domain[0] ||
            n2.y > this.domain[1] ||
            n2.y < this.domain[0])
            throw new Error("Nodes do not fit in the coordinate system!");
        let firstNode, secondNode;
        firstNode = this.getOrElse(n1, n1);
        secondNode = this.getOrElse(n2, n2);
        firstNode.connectTo(secondNode, bidirectional);
        // adds if they don't exist yet
        return this.addNode(firstNode, secondNode);
    }
    equals(other) {
        return this._nodes.every(other.contains);
    }
}
exports.default = DirectedGraph;
//# sourceMappingURL=DirectedGraph.js.map