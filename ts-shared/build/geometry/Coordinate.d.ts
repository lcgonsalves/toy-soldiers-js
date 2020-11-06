import I2DPoint from "./I2DPoint";
export default class Coordinate implements I2DPoint {
    readonly x: number;
    readonly y: number;
    constructor(x: number, y: number);
    /**
     * Returns true if coordinates are equal.
     * @param other
     */
    equals(other: I2DPoint): boolean;
    /**
     * Returns the midpoint between two coordinates.
     * @param other
     */
    midpoint(other: I2DPoint): I2DPoint;
    /**
     * Returns the distance between two coordinates.
     * @param other
     */
    distance(other: I2DPoint): number;
}
