import Vector from "../util/Vector";
import IComparable from "../util/IComparable";
import {ISerializable, SerializableObject, SObj} from "../util/ISerializable";
import {Subject, Subscription} from "rxjs";

/**
 * Interface for components that have translate() methods.
 */
export interface IMovable<T = ICoordinate> {

    /** Changes value of current coordinate to given x-y value */
    translateTo (x: number, y: number): T;

    /** adds values to given coordinate */
    translateBy (x: number, y: number): T;

    /** Changes value of current coordinate to given x-y value */
    translateToCoord (other: ICoordinate): T;

}

/**
 * Defines properties of two dimensional points and operations
 * between them.
 */
export interface ICoordinate extends IComparable, IMovable {
    readonly x: number;
    readonly y: number;
    readonly copy: this;

    /** observable for the position change */
    readonly $positionChange: Subject<ICoordinate>;

    /**
     * Centralizing all super calls that mutate x and y values in this function for better maintainability.
     * @param newPos
     * @private
     */
    setPosition(newPos: {x: number, y: number}): void;

    /** Returns a simple shallow copy of this coordinate (just x, and y) */
    readonly simple: ICoordinate;

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
     * Returns the distance between two point-like items, separated into
     * the x and y component, such that applying translateBy() using the output
     * of this function would result in the same transformation as calling translateToCoord().
     * @param other
     */
    distanceInComponents(other: ICoordinate): {
        x: number,
        y: number
    };

    /**
     * Returns a vector calculated between this coordinate
     * and another given coordinate.
     * @param other
     */
    vectorTo(other: ICoordinate): Vector;

    /** Returns a vector perpendicular to the vector between this coordinate and other */
    perpendicularVector(other: ICoordinate, ccw?: boolean): Vector;

    /** Returns true if the given ICoordinate shares the same coordinates */
    overlaps(other: ICoordinate): boolean;

    /** converts coordinate to a d3 friendly format */
    toTuple(): [number, number];

    /** corresponding string representation */
    toString(): string;

    /**
     * Handle events where the coordinate changes position.
     * @param handler
     */
    onChange(handler: (ICoordinate) => void): Subscription;

}

export class Coordinate implements ICoordinate, ISerializable {

    public get y(): number {
        return this._y;
    }
    public get x(): number {
        return this._x;
    }
    public get copy(): this {
        // @ts-ignore
        return new this.constructor(this.x, this.y);
    }

    public get simple(): ICoordinate {
        return C(this.x, this.y);
    }

    static get origin(): ICoordinate { return new Coordinate(0,0); }

    private _x: number;
    private _y: number;

    // observable that fires a reference to this instance every time its position changes
    private _$positionChange: Subject<ICoordinate> | undefined;

    get $positionChange(): Subject<ICoordinate> {
        if (!this._$positionChange) this._$positionChange = new Subject();
        return this._$positionChange;
    }

    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    /**
     * Centralizing all super calls that mutate x and y values in this function for better maintainability.
     * @param newPos
     * @private
     */
    public setPosition(newPos: {x: number, y: number}): void {
        this._x = newPos.x;
        this._y = newPos.y;

        // notify observable if we have any listeners
        if (this._$positionChange) this._$positionChange.next(this);
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

        if (
            other.x === this.x
        ) return Math.abs(other.y - this.y);
        else if (other.y === this.y)
            return Math.abs(other.x - this.x);
        return Math.sqrt(
            Math.pow(other.x - this.x, 2) +
            Math.pow(other.y - this.y, 2)
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
        this.setPosition({x, y});
        return this;
    }

    distanceInComponents(other: ICoordinate): { x: number; y: number } {
        const v = this.vectorTo(other);

        return {x: v.at(0), y: v.at(1)};
    }

    translateToCoord(other: ICoordinate): ICoordinate {
        this.setPosition(other);
        return this;
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
        this.setPosition({
            x: x + this.x,
            y: y + this.y
        });
        return this;
    }

    toTuple(): [number, number] {
        return [this._x, this._y];
    }

    toString(): string {
        return `(${this.x.toFixed(1)}, ${this.y.toFixed(1)})`;
    }

    get serialize(): string {
        return this.simplified.toString();
    }

    get simplified(): SerializableObject {
        return SObj({
            x: this.x,
            y: this.y
        });
    }

    onChange(handler: (ICoordinate) => void): Subscription {

        // only instantiate a subject when needed.
        if (!this._$positionChange) this._$positionChange = new Subject<this>();

        return this._$positionChange.subscribe(handler);

    }


}

/**
 * Shorthand for instantiating coordinates.
 * @param x
 * @param y
 * @constructor
 */
export function C(x: number, y: number): ICoordinate { return new Coordinate(x,y) }
