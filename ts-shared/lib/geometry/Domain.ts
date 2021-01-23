import IComparable from "../util/IComparable";
import {Interval} from "./Interval";
import {Coordinate, ICoordinate} from "./Coordinate";

/**
 * Defines abstracts the concept of two dimensional intervals
 * in the x and y axes.
 */
export default class Domain implements IComparable {

    private readonly _x: Interval;
    private readonly _y: Interval;

    /** The set of numbers available for the X component */
    get x(): Interval {
        return this._x;
    }
    /** The set of numbers available for the Y component */
    get y(): Interval {
        return this._y;
    }

    constructor(xDomain: Interval, yDomain: Interval) {
        this._x = xDomain;
        this._y = yDomain;
    }

    equals(other: IComparable): boolean {
        if (!(other instanceof Domain)) return false;
        return this.x.equals(other.x) && this.y.equals(other.y);
    }

    /**
     * Returns a new coordinate moved to a position that is coherent with
     * the domain.
     *
     * @param {ICoordinate} coord the given coordinate
     */
    public snap<CoordinateLike extends ICoordinate>(coord: CoordinateLike): ICoordinate {
        return coord.copy;
    }

}