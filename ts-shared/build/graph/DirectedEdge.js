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
    toString() {
        return `${this._from.toString()} -> ${this._to.toString()}`;
    }
    equals(other) {
        return this._to.equals(other._to) && this._from.equals(other._from);
    }
}
exports.default = DirectedEdge;
//# sourceMappingURL=DirectedEdge.js.map