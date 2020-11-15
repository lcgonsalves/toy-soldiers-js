"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Line_1 = require("../geometry/Line");
const Shorthands_1 = require("../util/Shorthands");
/** Encodes a connection between a source and a destination */
class DirectedEdge {
    constructor(from, to) {
        this._from = from;
        this._to = to;
    }
    get to() { return this._to; }
    get from() { return this._from; }
    get id() { return `${this.from.id}->${this.to.id}`; }
    get toVector() { return this.from.vectorTo(this.to); }
    get toLine() { return Line_1.Line.from(this.from, this.to); }
    get midpoint() { return this.from.midpoint(this.to); }
    get size() { return this.toVector.length(); }
    toString() {
        return `${this._from.toString()} -> ${this._to.toString()}`;
    }
    equals(other) {
        return other instanceof DirectedEdge && this._to.equals(other._to) && this._from.equals(other._from);
    }
    /** Returns coordinate of point (x1,y1) as defined in the usage of d3.path().arcTo() from a given curvature degree parameter */
    getArcToTangentPoint(intersectingNode) {
        const { from, to } = this;
        const midpoint = from.midpoint(to);
        const curvature = intersectingNode ? intersectingNode.radius + intersectingNode.bufferRadius : 0;
        const perpendicularVec = from.perpendicularVector(midpoint);
        const radius = (4 * Shorthands_1.sq(curvature) + Shorthands_1.sq(from.distance(to))) / (8 * curvature);
        const degree = radius - curvature;
        const ratio = perpendicularVec.length() / degree;
        const finalVectorA = perpendicularVec.scale(ratio);
        const finalVectorB = finalVectorA.scale(-1);
        // pick final vector based on the shortest distance between apex and intersecting node coord
        let finalVector = intersectingNode &&
            finalVectorA.getEndpoint(midpoint).distance(intersectingNode) >
                finalVectorB.getEndpoint(midpoint).distance(intersectingNode) ?
            finalVectorA :
            finalVectorB;
        return finalVector.getEndpoint(midpoint);
    }
    /** returns radius needed for a when given an intersecting node */
    getCurveRadius(intersectingNode) {
        const { from, to } = this;
        const midpoint = from.midpoint(to);
        const curvature = intersectingNode ? intersectingNode.radius + intersectingNode.bufferRadius : 0;
        return (4 * Shorthands_1.sq(curvature) + Shorthands_1.sq(from.distance(to))) / (8 * curvature);
    }
    shortestDistanceBetween(point) {
        return Line_1.Line.from(this.from, this.to).shortestDistanceBetween(point);
    }
    /** determines if a given Node is collinear (intersects, collides) with a straight line between
     * the nodes of this edge */
    intersects(node) {
        const distanceToEdge = this.shortestDistanceBetween(node);
        const distanceToA = this.from.distance(node);
        const distanceToB = this.to.distance(node);
        const intersectsLine = distanceToEdge <= node.radius + node.bufferRadius;
        return intersectsLine && !(distanceToA > this.size || distanceToB > this.size);
    }
}
exports.default = DirectedEdge;
//# sourceMappingURL=DirectedEdge.js.map