import ICoordinate from "./ICoordinate";
import { Vector } from "ts-matrix";
export default class Coordinate implements ICoordinate {
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
    vector(other: ICoordinate): Vector;
    moveTo(x: number, y: number): ICoordinate;
}
