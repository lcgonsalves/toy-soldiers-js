"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Encodes a connection between a source and a destination */
class DirectedEdge {
    constructor(from, to) {
        this._from = from;
        this._to = to;
    }
    get to() { return this._to; }
    get from() { return this._from; }
    get toVector() { return this.from.vector(this.to); }
    get id() { return `${this.from.id}->${this.to.id}`; }
    toString() {
        return `${this._from.toString()} -> ${this._to.toString()}`;
    }
    equals(other) {
        return other instanceof DirectedEdge && this._to.equals(other._to) && this._from.equals(other._from);
    }
    /** Returns coordinate of point (x1,y1) as defined in the usage of d3.path().arcTo() from a given degree parameter */
    getArcTangentPoint(degree = 10) {
        const { from, to } = this;
        const midpoint = from.midpoint(to);
        const perpendicularVectorMTo = from.perpedicularVector(midpoint);
        const radius = Math.sqrt(Math.pow(degree, 2) + Math.pow(from.vector(midpoint).length(), 2));
        const ratio = perpendicularVectorMTo.length() / degree;
        const finalVector = perpendicularVectorMTo.scale(ratio).add(perpendicularVectorMTo);
        const tangentPoint = null;
        return tangentPoint;
    }
}
exports.default = DirectedEdge;
//# sourceMappingURL=DirectedEdge.js.map