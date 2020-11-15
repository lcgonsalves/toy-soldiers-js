import {Vector as TSVector} from "ts-matrix";
import Matrix from "./Matrix";
import {Coordinate, ICoordinate} from "../geometry/Coordinate";


export default class Vector extends TSVector {

    // TODO: handle more than two dimensional
    /** Returns the endpoint coordinate for the given vector starting
     * from @param startingFrom. If no ICoordinate is specified,
     * the function returns the coordinate starting from the origin.
     *
     * @param startingFrom {ICoordinate} initial point (source of vector)
     * @returns {ICoordinate} coordinate representing end point
     */
    getEndpoint(startingFrom: ICoordinate = new Coordinate(0, 0)): ICoordinate {
        if (this.rows !== 2) throw new Error("Only two dimensional vectors may be converted to ICoordinates!");
        const [x, y]= this.values;
        return new Coordinate(startingFrom.x + x, startingFrom.y + y);
    }

    /** returns Matrix equivalent of a vector */
    get toMatrix(): Matrix {
        return new Matrix(this.rows, 1, this.values.map(val => [val]));
    }

    /** returns the unit vector of this vector */
    get unit(): Vector {
        const newValues = this.values.map(component => component / this.length());
        this.values = newValues;
        return this;
    }

    /** façade methods for conversion */
    addAValue(): Vector { return super.addAValue() as Vector };
    equals(vec: TSVector): boolean { return super.equals(vec); }
    negate(): TSVector { return super.negate() as Vector };
    add(vector: TSVector): Vector { return new Vector(super.add(vector).values) };
    scale(scale: number): Vector { return new Vector(super.scale(scale).values) };
    subtract(vector: TSVector): Vector { return new Vector(super.substract(vector).values) };
    multiply(vector: TSVector): Vector { return new Vector(super.multiply(vector).values) };
    divide(vector: TSVector): Vector { return new Vector(super.divide(vector).values) };
    normalize(): Vector { return new Vector(super.normalize().values) };
    cross(vector: TSVector): Vector { return new Vector(super.cross(vector).values) };
    mix(vector: TSVector, time: number): Vector { return new Vector(super.mix(vector, time).values) };

}