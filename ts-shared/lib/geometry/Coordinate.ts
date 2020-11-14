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

    /** adds values to given coordinate */
    moveBy(x: number, y: number): ICoordinate;

    /** Returns true if the given ICoordinate shares the same coordinates */
    overlaps(other: ICoordinate): boolean;

}

export class Coordinate implements ICoordinate {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Returns true if coordinates are equal.
     * @param other
     */
    equals(other: ICoordinate): boolean {
        return (this.x === other.x) && (this.y === other.y);
    }

    /**
     * Returns the midpoint between two coordinates.
     * @param other
     */
    midpoint(other: ICoordinate): ICoordinate {
        return new Coordinate((this.x + other.x) / 2, (this.y + other.y) / 2);
    }

    /**
     * Returns the distance between two coordinates.
     * @param other
     */
    distance(other: ICoordinate): number {

        return Math.sqrt(
            Math.pow(this.x - other.x, 2) +
            Math.pow(this.y - other.y, 2)
        )

    }

    /**
     * Returns a vector from this to other Coordinate
     * @param other
     */
    vectorTo(other: ICoordinate): Vector {
        const x = other.x - this.x;
        const y = other.y - this.y;

        return new Vector([x, y]);
    }

    moveTo(x: number, y: number): ICoordinate {
        this.x = x;
        this.y = y;
        return this;
    }

    overlaps(other: ICoordinate): boolean {
        return this.x === other.x && this.y === other.y;
    }

    perpendicularVector(other: ICoordinate, ccw: boolean = true): Vector {
        let x, y;

        x = -(this.y - other.y);
        y = this.x - other.x;

        const v = new Vector([x, y]);
        return ccw ? v : v.scale(-1);
    }

    moveBy(x: number, y: number): ICoordinate {
        this.x += x;
        this.y += y;
        return this;
    }

}