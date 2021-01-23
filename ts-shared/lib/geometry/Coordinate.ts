import Vector from "../util/Vector";
import IComparable from "../util/IComparable";

/**
 * Defines properties of two dimensional points and operations
 * between them.
 */
export interface ICoordinate extends IComparable {
    readonly x: number;
    readonly y: number;
    readonly copy: ICoordinate;

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
    perpendicularVector(other: ICoordinate, ccw?: boolean): Vector;

    /** Changes value of current coordinate to given x-y value */
    translateTo(x: number, y: number): ICoordinate;

    /** adds values to given coordinate */
    translateBy(x: number, y: number): ICoordinate;

    /** Changes value of current coordinate to given x-y value */
    translateToCoord(other: ICoordinate): ICoordinate;

    /** Returns true if the given ICoordinate shares the same coordinates */
    overlaps(other: ICoordinate): boolean;

    /** converts coordinate to a d3 friendly format */
    toTuple(): [number, number];

    /** corresponding string representation */
    toString(): string;

}

export class Coordinate implements ICoordinate {
    public get y(): number {
        return this._y;
    }
    public get x(): number {
        return this._x;
    }
    public get copy(): Coordinate {
        return new Coordinate(this.x, this.y);
    }

    static get origin(): ICoordinate { return new Coordinate(0,0); }

    private _x: number;
    private _y: number;

    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    /**
     * Returns true if coordinates are equal.
     * @param other
     */
    equals(other: ICoordinate): boolean {
        return (this._x === other.x) && (this._y === other.y);
    }

    /**
     * Returns the midpoint between two coordinates.
     * @param other
     */
    midpoint(other: ICoordinate): ICoordinate {
        return new Coordinate((this._x + other.x) / 2, (this._y + other.y) / 2);
    }

    /**
     * Returns the distance between two coordinates.
     * @param other
     */
    distance(other: ICoordinate): number {

        return Math.sqrt(
            Math.pow(this._x - other.x, 2) +
            Math.pow(this._y - other.y, 2)
        )

    }

    /**
     * Returns a vector from this to other Coordinate
     * @param other
     */
    vectorTo(other: ICoordinate): Vector {
        const x = other.x - this._x;
        const y = other.y - this._y;

        return new Vector([x, y]);
    }

    translateTo(x: number, y: number): ICoordinate {
        this._x = x;
        this._y = y;
        return this;
    }

    translateToCoord(other: ICoordinate): ICoordinate {
        return this.translateTo(other.x, other.y);
    }

    overlaps(other: ICoordinate): boolean {
        return this._x === other.x && this._y === other.y;
    }

    perpendicularVector(other: ICoordinate, ccw: boolean = true): Vector {
        let x, y;

        x = -(this._y - other.y);
        y = this._x - other.x;

        const v = new Vector([x, y]);
        return ccw ? v : v.scale(-1);
    }

    translateBy(x: number, y: number): ICoordinate {
        this._x += x;
        this._y += y;
        return this;
    }

    toTuple(): [number, number] {
        return [this._x, this._y];
    }

    toString(): string {
        return `(${this.x.toFixed(1)}, ${this.y.toFixed(1)})`;
    }

}