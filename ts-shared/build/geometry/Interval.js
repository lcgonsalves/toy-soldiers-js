"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interval = void 0;
class Interval {
    constructor(min, max, upperBoundInclusive = true, lowerBoundInclusive = true) {
        this.max = max;
        this.min = min;
        this.upperBoundInclusive = upperBoundInclusive;
        this.lowerBoundInclusive = lowerBoundInclusive;
    }
    /** returns true if value is a subset of this interval */
    contains(value) {
        if (value instanceof Interval)
            return this.containsInterval(value); // run contains interval
        else if (value instanceof Array &&
            value.length > 0)
            return value.every(element => {
                typeof element === "number" && this.containsNumber(element);
            });
        else if (typeof value === "number")
            return this.containsNumber(value);
        else
            throw new Error("Type mismatch – value is neither a number, number[], or Interval");
    }
    /** returns true if number is between min and max */
    containsNumber(num) {
        let belowUpper = false;
        let aboveLower = false;
        if (this.upperBoundInclusive) {
            belowUpper = num <= this.max;
        }
        else {
            belowUpper = num < this.max;
        }
        if (this.lowerBoundInclusive) {
            aboveLower = num >= this.min;
        }
        else {
            aboveLower = num > this.min;
        }
        return aboveLower && belowUpper;
    }
    /** returns true if interval is between min and max.
     * this function does not consider the parameter interval's
     * inclusivity. */
    containsInterval(interval) {
        return this.containsNumber(interval.max) && this.containsNumber(interval.min);
    }
    /** returns true if other item behaves like this interval */
    equals(other) {
        const otherInterval = other;
        return (other instanceof Interval) &&
            otherInterval.max === this.max &&
            otherInterval.min === this.min &&
            otherInterval.upperBoundInclusive === this.upperBoundInclusive &&
            otherInterval.lowerBoundInclusive === this.lowerBoundInclusive;
    }
}
exports.Interval = Interval;
//# sourceMappingURL=Interval.js.map