"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
}
exports.default = Coordinate;
//# sourceMappingURL=Coordinate.js.map