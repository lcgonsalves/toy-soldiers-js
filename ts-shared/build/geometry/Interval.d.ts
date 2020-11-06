/** Defines the concept of a */
export interface Interval {
    readonly min: number;
    readonly max: number;
    readonly upperBoundInclusive: boolean;
    readonly lowerBoundInclusive: boolean;
    contains(): any;
}
