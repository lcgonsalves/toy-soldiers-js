import Vector from "../util/Vector";
import IComparable from "../util/IComparable";
/**
 * Defines properties of two dimensional points and operations
 * between them.
 */
export interface ICoordinate extends IComparable {
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
    vectorTo(other: ICoordinate): Vector;
    /** Returns a vector perpendicular to the vector between this coordinate and other */
    perpendicularVector(other: ICoordinate, ccw: boolean): Vector;
    /** Changes value of current coordinate to given x-y value */
    moveTo(x: number, y: number): ICoordinate;
    /** Returns true if the given ICoordinate shares the same coordinates */
    overlaps(other: ICoordinate): boolean;
}
export declare class Coordinate implements ICoordinate {
    x: number;
    y: number;
    constructor(x: number, y: number);
    /**
     * Returns true if coordinates are equal.
     * @param other
     */
    equals(other: ICoordinate): boolean;
    /**
     * Returns the midpoint between two coordinates.
     * @param other
     */
    midpoint(other: ICoordinate): ICoordinate;
    /**
     * Returns the distance between two coordinates.
     * @param other
     */
    distance(other: ICoordinate): number;
    /**
     * Returns a vector from this to other Coordinate
     * @param other
     */
    vectorTo(other: ICoordinate): Vector;
    moveTo(x: number, y: number): ICoordinate;
    overlaps(other: ICoordinate): boolean;
    perpendicularVector(other: ICoordinate, ccw?: boolean): Vector;
}
