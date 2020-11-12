import {Matrix as TSMatrix, Vector as TSVector} from "ts-matrix";
import Vector from "./Vector";

export default class Matrix extends TSMatrix {
    /** If Matrix has a Vector equivalent, returns Vector. Otherwise error will be thrown */
    get toVector(): Vector {
        if (this.columns > 1) throw new Error("Only two dimensional vectors may be converted to ICoordinates!");
        return new Vector(this.values.map(_ => _[0]));
    }

    /** constructor for conversion */
    static from(m: TSMatrix): Matrix {
        return new Matrix(m.rows, m.columns, m.values);
    }

    /** façade methods for conversion */

    addAColumn(): Matrix { return Matrix.from(super.addAColumn()) };
    addARow(): Matrix { return Matrix.from(super.addARow()) };
    static identity(dimension: number): Matrix { return Matrix.from(super.identity(dimension)) };
    multiply(mat: TSMatrix): Matrix { return Matrix.from(super.multiply(mat)) };
    getCofactor(row: number, col: number): Matrix { return Matrix.from(super.getCofactor(row,col)) };
    transpose(): Matrix { return Matrix.from(super.transpose()) };
    inverse(): Matrix { return Matrix.from(super.transpose()) };

}