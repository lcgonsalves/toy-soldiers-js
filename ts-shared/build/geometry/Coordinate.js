"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Vector_1 = require("../util/Vector");
class Coordinate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * Returns true if coordinates are equal.
     * @param other
     */
    equals(other) {
        return (this.x === other.x) && (this.y === other.y);
    }
    /**
     * Returns the midpoint between two coordinates.
     * @param other
     */
    midpoint(other) {
        return new Coordinate((this.x + other.x) / 2, (this.y + other.y) / 2);
    }
    /**
     * Returns the distance between two coordinates.
     * @param other
     */
    distance(other) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) +
            Math.pow(this.y - other.y, 2));
    }
    /**
     * Returns a vector from this to other Coordinate
     * @param other
     */
    vector(other) {
        const x = other.x - this.x;
        const y = other.y - this.y;
        return new Vector_1.default([x, y]);
    }
    moveTo(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    overlaps(other) {
        return this.x === other.x && this.y === other.y;
    }
    perpedicularVector(other, ccw) {
        let x, y;
        x = this.y - other.y;
        y = this.x - other.x;
        if (!ccw) {
            x = -x;
            y = -y;
        }
        return new Vector_1.default([x, y]);
    }
}
exports.default = Coordinate;
//# sourceMappingURL=Coordinate.js.map