/** Defines the concept of a */
import IComparable from "../util/IComparable";
export declare class Interval implements IComparable {
    readonly min: number;
    readonly max: number;
    readonly upperBoundInclusive: boolean;
    readonly lowerBoundInclusive: boolean;
    constructor(min: number, max: number, upperBoundInclusive?: boolean, lowerBoundInclusive?: boolean);
    /** returns true if value is a subset of this interval */
    contains(value: number | number[] | Interval): boolean;
    /** returns true if number is between min and max */
    private containsNumber;
    /** returns true if interval is between min and max.
     * this function does not consider the parameter interval's
     * inclusivity. */
    private containsInterval;
    /** returns true if other item behaves like this interval */
    equals(other: IComparable): boolean;
}
