"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DirectedEdge_1 = require("./DirectedEdge");
const Coordinate_1 = require("../geometry/Coordinate");
class Node {
    constructor(id, x, y, edges = []) {
        this._weight = 2.5;
        this._id = id;
        this._coordinate = new Coordinate_1.default(x, y);
        this._edges = edges;
    }
    get y() { return this._coordinate.y; }
    get x() { return this._coordinate.x; }
    get edges() { return this._edges; }
    get coord() { return this._coordinate; }
    get id() { return this._id; }
    get weight() { return this._weight; }
    set weight(value) { this._weight = value; }
    /** returns midpoint between two nodes */
    midpoint(other) {
        return this._coordinate.midpoint(other);
    }
    /** returns distance between two nodes */
    distance(other) {
        return this._coordinate.distance(other);
    }
    /** returns vector between two nodes */
    vector(other) {
        return this.coord.vector(other);
    }
    /** reassigns this Node's coordinate to a new value */
    moveTo(x, y) {
        this._coordinate.moveTo(x, y);
        return this;
    }
    /** Converts the node and its immediate connections to a string */
    toStringComplex() {
        const destinations = this._edges.map(e => e.to.toStringSimple());
        if (this._edges.length === 0 || destinations.length === 0)
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
        this._edges = template._edges;
        return this;
    }
    /**
     * Returns true if other node is directly accessible from this node.
     * O(edges.length)
     *
     */
    isAdjacent(other) {
        return !!this._edges.find(edge => edge.to.equals(other));
    }
    /** Gets all the nodes immediately adjacent to this. */
    getAdjacent() {
        return this._edges.map(edge => edge.to);
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
            this._edges.push(new DirectedEdge_1.default(this, other));
        }
        return this;
    }
    overlaps(other) {
        // if (other instanceof Node) handle weight possibility
        return this.coord.overlaps(other);
    }
    perpedicularVector(other) {
        return this.coord.perpedicularVector(other);
    }
}
exports.default = Node;
//# sourceMappingURL=Node.js.map