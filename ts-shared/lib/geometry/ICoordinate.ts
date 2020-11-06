import IComparable from "../util/IComparable";

/**
 * Defines properties of two dimensional points and operations
 * between them.
 */
export default interface I2DPoint extends IComparable {
    x: number;
    y: number;

    /**
     * Returns the midpoint between two point-like items.
     * @param other
     */
    midpoint(other: I2DPoint): I2DPoint;

    /**
     * Returns the distance between two point-like items.
     * @param other
     */
    distance(other: I2DPoint): number;

}