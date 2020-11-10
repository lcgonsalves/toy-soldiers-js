import IComparable from "../util/IComparable";
import Vector from "../util/Vector";

/**
 * Defines properties of two dimensional points and operations
 * between them.
 */
export default interface ICoordinate extends IComparable {
    x: number;
    y: number;

    /**
     * Returns the midpoint between two point-like items.
     * @param other
     */
    midpoint(other: ICoordinate): ICoordinate;

    /**
     * Returns the distance between two point-like items.
     * @param other
     */
    distance(other: ICoordinate): number;

    /**
     * Returns a vector calculated between this coordinate
     * and another given coordinate.
     * @param other
     */
    vector(other: ICoordinate): Vector;

    /** Returns a vector perpendicular to the vector between this coordinate and other */
    perpedicularVector(other: ICoordinate): Vector;

    /** Changes value of current coordinate to given x-y value */
    moveTo(x: number, y: number): ICoordinate;

    /** Returns true if the given ICoordinate shares the same coordinates */
    overlaps(other: ICoordinate): boolean;

}