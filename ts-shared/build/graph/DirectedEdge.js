"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Encodes a connection between a source and a destination */
class DirectedEdge {
    constructor(from, to) {
        this._from = from;
        this._to = to;
    }
    get to() {
        return this._to;
    }
    get from() {
        return this._from;
    }
    get toVector() {
        return this.from.vector(this.to);
    }
    /** gets id corresponding to the pair of nodes associated by this edge */
    get id() {
        return `${this.from.id}->${this.to.id}`;
    }
    toString() {
        return `${this._from.toString()} -> ${this._to.toString()}`;
    }
    equals(other) {
        return this._to.equals(other._to) && this._from.equals(other._from);
    }
}
exports.default = DirectedEdge;
//# sourceMappingURL=DirectedEdge.js.map