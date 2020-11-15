import Matrix from "./Matrix";
import {Coordinate, ICoordinate} from "../geometry/Coordinate";

// extended from github.com/Kapcash/ts-matrix
export default class Vector {
    private _values: number[];
    constructor(values?: number[]) {
        // Create matrix filled with 0 by default
        this._values = new Array<number>((values || [0]).length).fill(0);

        if (values) {
            this.values = values;
        }
    }

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

    get rows() {
        return this.values.length;
    }

    get values() {
        return this._values;
    }

    /**
     * Set values into the vector.
     * If the parameters vector is to wide, the values are cropped to the current vector size.
     * It the parameters vector is to small, remaining cells will be filled with 0.
     * @param newValues Arrays of new values.
     */
    set values(newValues: number[]) {
        const minSize = Math.min(this.values.length, newValues.length);
        for (let i = 0; i < minSize; i++) {
            this.values[i] = newValues[i];
        }
    }

    /**
     * Get a matrix value, from its position
     * @param row Matrix line, from 0 to `rows`
     */
    at(row: number): number {
        return this.values[row];
    }

    /** Sets all matrix values to 0 */
    reset(): void {
        this.values = this.values.fill(0);
    }

    /** Add an new row to the matrix, filled with 0 */
    addAValue(value: number): Vector {
        this.values.push(value);
        return new Vector(this.values);
    }

    /**
     * Check if two vectors are equals, value by value
     * @param vec the vector to check against
     */
    equals(vec: Vector): boolean {
        return (this.rows === vec.rows)
            && this.values.reduce((eql: boolean, val, i) => eql && vec.at(i) === val, true);
    }

    /**
     * Negate all values of the vector (get the opposite sign)
     * @return A new vector whose all values have the opposed sign
     */
    negate(): Vector {
        return new Vector(this.values.map((val) => -val));
    }

    /** Get the length of the vector */
    length(): number {
        return Math.sqrt(this.squaredLength());
    }

    /** Get the squared length of the vector */
    squaredLength(): number {
        return this.dot(this);
    }

    /**
     * Add all vector values with the same position value of the operand vector
     * @param vector The operand vector
     * @throws Error if the two vectors don't have the same dimension
     * @return a new Vector with the result values
     */
    add(vector: Vector): Vector {
        if (this.rows !== vector.rows) throw new Error("Vectors don't have the same dimension!");
        return this.operateOnAllValues((val, i) => (val + vector.at(i)));
    }

    /**
     * Sunstract all vector values with the same position value of the operand vector
     * @param vector The operand vector
     * @throws Error if the two vectors don't have the same dimension
     * @return a new Vector with the result values
     */
    substract(vector: Vector): Vector {
        if (this.rows !== vector.rows) throw new Error("Vectors don't have the same dimension!");
        return this.operateOnAllValues((val, i) => (val - vector.at(i)));
    }

    /**
     * Multiply all vector values with the same position value of the operand vector
     * @param vector The operand vector
     * @throws Error if the two vectors don't have the same dimension
     * @return a new Vector with the result values
     */
    multiply(vector: Vector): Vector {
        if (this.rows !== vector.rows) throw new Error("Vectors don't have the same dimension!");
        return this.operateOnAllValues((val, i) => (val * vector.at(i)));
    }

    /**
     * Divide all vector values with the same position value of the operand vector
     * Be aware of divisions by 0!
     * @param vector The operand vector
     * @throws Error if the two vectors don't have the same dimension
     * @return a new Vector with the result values
     */
    divide(vector: Vector): Vector {
        if (this.rows !== vector.rows) throw new Error("Vectors don't have the same dimension!");
        return this.operateOnAllValues((val, i) => {
            if (vector.at(i) === 0) return val;
            return (val / vector.at(i));
        });
    }

    /**
     * Multiply all vector values by the given number
     * @param scale The number to multiply with the values
     */
    scale(scale: number): Vector {
        return this.operateOnAllValues((val) => (val * scale));
    }

    /**
     * Run a function on all vector values, as a map.
     * @param operation The mapping method
     * @return a new Vector with the operation done on all its values
     */
    private operateOnAllValues(operation: (val: number, index: number) => number): Vector {
        return new Vector(this.values.map(operation));
    }

    /**
     * Computes the normalized vector
     * @return The normalized vector
     */
    normalize(): Vector {
        const vectorLength = this.length();
        return this.operateOnAllValues((val) => val / vectorLength);
    }

    /**
     * Computes the dot product of vectors
     * @param vector The operand vector
     */
    dot(vector: Vector): number {
        return this.values.reduce((res, val, i) => res + (val * vector.at(i)), 0);
    }

    /**
     * Computes the cross product of vectors
     * @param vector The operand vector
     */
    cross(vector: Vector): Vector {
        if (this.rows < 3 || vector.rows < 3) throw new Error('Cross product is possible on 3D vectors only');
        const crossValues = new Array<number>(3);
        crossValues[0] = this.at(1) * vector.at(2) - this.at(2) * vector.at(1);
        crossValues[1] = this.at(2) * vector.at(0) - this.at(0) * vector.at(2);
        crossValues[2] = this.at(0) * vector.at(1) - this.at(1) * vector.at(0);
        return new Vector(crossValues);
    }

    mix(vector: Vector, time: number): Vector {
        return new Vector(this.values.map((val, i) => val + time * (vector.at(i) - val)));
    }

    static get360angle(Va: Vector, Vb: Vector) {
        if (Va.rows !== 3 || Vb.rows !== 3) throw new Error('Vectors must be in 3D!. You can add a 1 dimension if it is missing.');
        return -Math.atan2(
            Vb.cross(Va).dot(new Vector([0, 0, 1]).normalize()),
            Va.dot(Vb)
        );
    }

}