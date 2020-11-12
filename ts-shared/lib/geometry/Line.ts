import IComparable from "../util/IComparable";
import {ICoordinate} from "./Coordinate";

/** Generalizes functions and operations of a line */
export interface ILine extends IComparable {
    /** Returns the shortest distance between a given point and the line */
    shortestDistanceBetween(point: ICoordinate): number;
}

/** implementation of the concept of a line */
export class Line implements ILine {
    private readonly endPoint: ICoordinate;
    private readonly startingPoint: ICoordinate;

    /** fields encoding line equation ax + by + c = 0 */
    private readonly A: number;
    private readonly B: number;
    private readonly C: number;

    constructor(start: ICoordinate, end: ICoordinate) {
        this.startingPoint = start;
        this.endPoint = end;

        /** (𝑦1−𝑦2)𝑥 + (𝑥2−𝑥1)𝑦 + 𝑥1𝑦2 − 𝑥2𝑦1 = 0 */
        this.A = start.y - end.y;
        this.B = end.x - start.x;
        this.C = (start.x * end.y) - (end.x * start.y)
    }

    /**
     * Line is equal to another line if either of these 4 conditions are met:
     * 1) the A, B, C parameters are the same
     * 2) the A, B, C parameters are the same if the signs are flipped
     * 3) the start and end points are the same
     * 4) the start point is the same as the other end point,
     *    and the end point is the same as the other start point
     *
     * @param {IComparable} other Line or any IComparable
     */
    equals(other: IComparable): boolean {
        const equationOfLineParamsAreEquivalent = other instanceof Line &&
            ((other.A === this.A &&
            other.B === this.B &&
            other.C === this.C ) || (
                other.A === -this.A &&
                other.B === -this.B &&
                other.C === -this.C
            ));
        const startAndEndPointsAreEquivalent = other instanceof Line &&
            ((
                this.startingPoint.equals(other.startingPoint) &&
                this.endPoint.equals(other.endPoint)
            ) ||
            (
                this.startingPoint.equals(other.endPoint) &&
                this.endPoint.equals(other.startingPoint)
            ));

        return equationOfLineParamsAreEquivalent || startAndEndPointsAreEquivalent;
    }

    /**
     * Calculates the shortest distance between point and this line, utilizing
     * the dot product theorem for point (x0,y0):
     *
     * d = abs(a*x0 + b*y0 + c) / sqrt(a^2 + b^2)
     *
     * @param {ICoordinate} point the given point
     */
    shortestDistanceBetween(point: ICoordinate): number {
        const {abs, sqrt} = Math;
        const sq = (x: number): number => Math.pow(x, 2);
        const {A, B, C} = this;
        const {x, y} = point;

        const numerator = abs((A * x) + (B * y) + C);
        const denominator = sqrt( sq(A) + sq(B) );

        return numerator / denominator;
    }

    /** Constructor alternative */
    static from(start: ICoordinate, end: ICoordinate): Line {
        return new Line(start, end);
    }

}