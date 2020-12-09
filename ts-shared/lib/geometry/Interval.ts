/** Defines the concept of a */
import IComparable from "../util/IComparable";

/**
 * Defines a range of numbers between Interval.min and Interval.max, where each individual
 * number is defined by the step, starting from the min.
 *
 * Some examples:
 *   - Interval(0, 10, 1) is comparable to [0, 1, 2 ... 9, 10]
 *   - Interval(1, 9.5, 1) is comparable to [1, 2 ... 8, 9, 9.5]
 *   - Interval(0.986, 10, 1) is comparable to [0.986, 1, 2, ... 10]
 *
 *   Noting that if the step between the second-to-last integer and the max is higher
 *   than the difference between the integer and the max, then the last number will be clamped
 *   down to the max. The second integer in the interval is calculated by flooring the minimum, and
 *   then adding the step.
 *
 *   This is a weird continuous/discrete interval implementation because I don't really need to distinguish
 *   them.
 *
 */
export class Interval implements IComparable {
    readonly min: number;
    readonly max: number;
    readonly upperBoundInclusive: boolean;
    readonly lowerBoundInclusive: boolean;
    readonly step: number;

    constructor(
        min: number,
        max: number,
        step: number = 1,
        upperBoundInclusive: boolean = true,
        lowerBoundInclusive: boolean = true
    ) {
        this.max = max;
        this.min = min;
        this.upperBoundInclusive = upperBoundInclusive;
        this.lowerBoundInclusive = lowerBoundInclusive;
        this.step = parseInt(step.toFixed(0));
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

    /** returns true if number is higher than max */
    private numberIsAboveUpper(num: number): boolean {
        let belowUpper: boolean;

        if (this.upperBoundInclusive) {
            belowUpper = num <= this.max;
        } else {
            belowUpper = num < this.max;
        }

        return !belowUpper;
    }

    /** returns true if number is lower than max */
    private numberIsBelowLower(num: number): boolean {
        let aboveLower: boolean;

        if (this.lowerBoundInclusive) {
            aboveLower = num >= this.min;
        } else {
            aboveLower = num > this.min;
        }

        return !aboveLower;
    }

    /** returns true if number is between min and max */
    private containsNumber(num: number): boolean {
        return !this.numberIsAboveUpper(num) && !this.numberIsBelowLower(num);
    }

    /** returns true if interval is between min and max.
     * this function does not consider the parameter interval's
     * inclusivity. */
    private containsInterval(interval: Interval): boolean {
        return this.containsNumber(interval.max) && this.containsNumber(interval.min);
    }

    /** returns true if other item behaves like this interval */
    public equals(other: IComparable): boolean {
        const otherInterval = other as Interval;
        return (other instanceof Interval) &&
            otherInterval.step === this.step &&
            otherInterval.max === this.max &&
            otherInterval.min === this.min &&
            otherInterval.upperBoundInclusive === this.upperBoundInclusive &&
            otherInterval.lowerBoundInclusive === this.lowerBoundInclusive;
    }

    /** Clamps the number between min and max */
    public clamp(num: number): number {
        let out: number = num;

        if (this.numberIsBelowLower(out)) out = this.min;
        else if (this.numberIsAboveUpper(out)) out = this.max;

        return out;
    }

    /** Clamps the number and snaps it to the closest step */
    public snap(num: number): number {
        let out = this.clamp(num);

        if (out === this.min || out === this.max) return out;

        out = Math.round(out);
        const remainder: number = out % this.step;
        const correctedRemainderSign = remainder < this.step / 2 ? -remainder : this.step - remainder;

        return remainder === 0 ? out : out + correctedRemainderSign;
    }

    /** maps each number of this interval according to the middleware function */
    public map<T>(middleware: (n: number) => T): T[] {

        let out: T[] = [];

        this.forEach(n => out.push(middleware(n)));

        return out;

    }

    /** iterates over the interval and applies the callback to each value */
    public forEach<T>(callback: (n: number) => T): void {
        // apply on first
        const {min, max, step} = this;

        callback(min);

        let start = min < 0 ? Math.ceil(min) : Math.floor(min);

        // iterate over others, starting from second item and stopping before last
        for (let i = start + step; i < max; i += step) {
            callback(i);
        }

        // applu on last
        callback(max);

    }

}
