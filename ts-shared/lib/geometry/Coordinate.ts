import ICoordinate from "./ICoordinate";
import IComparable from "../util/IComparable";
import {Vector} from "ts-matrix";

export default class Coordinate implements ICoordinate {
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
    vector(other: ICoordinate): Vector {
        const x = other.x - this.x;
        const y = other.y - this.y;

        return new Vector([x, y]);
    }

    moveTo(x: number, y: number): ICoordinate {
        this.x = x;
        this.y = y;
        return this;
    }

}