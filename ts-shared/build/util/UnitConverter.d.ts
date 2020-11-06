import { Matrix, Vector } from "ts-matrix";
import ICoordinate from "../geometry/ICoordinate";
export default abstract class UnitConverter {
    /** Converts a vector to a matrix */
    static vectorToMatrix(vec: Vector): Matrix;
    /** Converts a matrix to a vector if the matrix has 1 column */
    static matrixToVector(matrix: Matrix): Vector;
    static vectorToCoordinate(vec: Vector): ICoordinate;
}
