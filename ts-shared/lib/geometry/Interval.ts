/** Defines the concept of a */
import IComparable from "../util/IComparable";

export class Interval implements IComparable {
    readonly min: number;
    readonly max: number;
    readonly upperBoundInclusive: boolean;
    readonly lowerBoundInclusive: boolean;

    constructor(
        min: number,
        max: number,
        upperBoundInclusive: boolean = true,
        lowerBoundInclusive: boolean = true
    ) {
        this.max = max;
        this.min = min;
        this.upperBoundInclusive = upperBoundInclusive;
        this.lowerBoundInclusive = lowerBoundInclusive;
    }

    /** returns true if value is a subset of this interval */
    contains(value: number | number[] | Interval): boolean {
        if ( value instanceof Interval ) return this.containsInterval(value); // run contains interval
        else if (
            value instanceof Array &&
            value.length > 0
        ) return value.every(element => {
            typeof element === "number" && this.containsNumber(element)
        });
        else if ( typeof value === "number" ) return this.containsNumber(value);
        else throw new Error("Type mismatch – value is neither a number, number[], or Interval");
    }

    /** returns true if number is between min and max */
    private containsNumber(num: number): boolean {
        let belowUpper = false;
        let aboveLower = false;

        if (this.upperBoundInclusive) {
            belowUpper = num <= this.max;
        } else {
            belowUpper = num < this.max;
        }

        if (this.lowerBoundInclusive) {
            aboveLower = num >= this.min;
        } else {
            aboveLower = num > this.min;
        }

        return aboveLower && belowUpper;
    }

    /** returns true if interval is between min and max.
     * this function does not consider the parameter interval's
     * inclusivity. */
    private containsInterval(interval: Interval): boolean {
        return this.containsNumber(interval.max) && this.containsNumber(interval.min);
    }

    /** returns true if other item behaves like this interval */
    equals(other: IComparable): boolean {
        const otherInterval = other as Interval;
        return (other instanceof Interval) &&
            otherInterval.max === this.max &&
            otherInterval.min === this.min &&
            otherInterval.upperBoundInclusive === this.upperBoundInclusive &&
            otherInterval.lowerBoundInclusive === this.lowerBoundInclusive;
    }

}