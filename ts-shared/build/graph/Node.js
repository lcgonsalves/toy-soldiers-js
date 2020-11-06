"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Coordinate_1 = require("../geometry/Coordinate");
const DirectedEdge_1 = require("./DirectedEdge");
class Node {
    constructor(id, x, y, edges = []) {
        this._id = id;
        this._coordinate = new Coordinate_1.default(x, y);
        this.edges = edges;
    }
    get y() { return this._coordinate.y; }
    get x() { return this._coordinate.x; }
    get coord() { return this._coordinate; }
    get id() { return this._id; }
    /** returns midpoint between two nodes */
    midpoint(other) {
        return this._coordinate.midpoint(other._coordinate);
    }
    /** returns distance between two nodes */
    distance(other) {
        return this._coordinate.distance(other._coordinate);
    }
    /** Converts the node and its immediate connections to a string */
    toStringComplex() {
        const destinations = this.edges.map(e => e.to.toStringSimple());
        if (this.edges.length === 0 || destinations.length === 0)
            return `(${this.x}, ${this.y})`;
        return `[${this._id}](${this.x}, ${this.y}) -> ${destinations.reduce((acc, cur) => acc + ", " + cur)}`;
    }
    /** Converts the node to a simple string with no edges */
    toStringSimple() {
        return `[${this._id}](${this.x}, ${this.y})`;
    }
    /** Returns true if the node has the same coordinates. */
    equals(other) {
        return this._id === other._id;
    }
    /** Updates edges of this node to be the same as a template. Template must pass _.equals() validation */
    updateEdges(template) {
        if (!template.equals(this))
            throw new Error("Cannot update edges from a different Node! Nodes must .equals() each other.");
        // TODO: do I need to verify if edges.from() all match this??
        this.edges = template.edges;
        return this;
    }
    /**
     * Returns true if other node is directly accessible from this node.
     * O(edges.length)
     *
     */
    isAdjacent(other) {
        return !!this.edges.find(edge => edge.to.equals(other));
    }
    /** Gets all the nodes immediately adjacent to this. */
    getAdjacent() {
        return this.edges.map(edge => edge.to);
    }
    /**
     * Connects this node to other node.
     *
     * @param {Node} other target node
     * @param {boolean} bidirectional optional – whether the connection should work both ways
     * @returns {Node} this node (for chaining connections)
     */
    connectTo(other, bidirectional = false) {
        if (bidirectional)
            other.connectTo(this);
        if (!this.isAdjacent(other)) {
            this.edges.push(new DirectedEdge_1.default(this, other));
        }
        return this;
    }
}
exports.default = Node;
//# sourceMappingURL=Node.js.map