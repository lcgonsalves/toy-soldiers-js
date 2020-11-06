import {Matrix, Vector} from "ts-matrix";
import ICoordinate from "../geometry/ICoordinate";
import Coordinate from "../geometry/Coordinate";

export default abstract class UnitConverter {
    /** Converts a vector to a matrix */
    static vectorToMatrix(vec: Vector): Matrix {
        return new Matrix(vec.rows, 1, vec.values.map(val => [val]));
    }

    /** Converts a matrix to a vector if the matrix has 1 column */
    static matrixToVector(matrix: Matrix): Vector {
        if (matrix.columns > 1) throw new Error("Cannot convert a matrix with more than 1 column!");
        return new Vector(matrix.values.map(_ => _[0]));
    }

    static vectorToCoordinate(vec: Vector): ICoordinate {
        if (vec.rows !== 2) throw Error("Cannot convert a vector unless it has 2 dimensions!");
        const [x, y]= vec.values;
        return new Coordinate(x, y);
    }
}
