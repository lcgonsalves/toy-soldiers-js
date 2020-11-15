import Vector from "./Vector";

// expanded from github.com/Kapcash/ts-matrix
export default class Matrix {
    private _rows: number;
    private _columns: number;
    private _values: number[][];

    constructor(rows: number, columns: number, values?: number[][]) {
        this._rows = rows;
        this._columns = columns;
        // Create matrix filled with 0 by default
        this._values = new Array<number[]>(rows).fill([]).map(() => new Array<number>(columns).fill(0));

        if (values) {
            this.values = values;
        }
    }

    /** If Matrix has a Vector equivalent, returns Vector. Otherwise error will be thrown */
    get toVector(): Vector {
        if (this.columns > 1) throw new Error("Only two dimensional vectors may be converted to ICoordinates!");
        return new Vector(this.values.map(_ => _[0]));
    }

    get rows() {
        return this._rows;
    }
    get columns() {
        return this._columns;
    }
    get values() {
        return this._values;
    }

    /**
     * Set values into the matrix.
     * If the parameters matrix is to wide, the values are cropped to the current matrix size.
     * It the parameters matrix is to small, remaining cells will be filled with 0.
     * @param newValues Arrays of new values.
     */
    set values(newValues: number[][]) {
        const minRow = Math.min(newValues.length, this.rows);
        const minCol = Math.min(newValues[0].length, this.columns);
        for (let r = 0; r < minRow; r++) {
            for (let c = 0; c < minCol; c++) {
                this.values[r][c] = newValues[r][c];
            }
        }
    }

    /**
     * Get a matrix value, from its position
     * @param row Matrix line, from 0 to `rows`
     * @param col Matric column, from 0 to `columns`
     */
    at(row: number, col: number): number {
        return this.values[row][col];
    }

    /**
     * Sets all matrix values to 0
     */
    reset(): void {
        this.values = this.values.map((row) => row.map(() => 0));
    }

    /**
     * Add an new column to the matrix, filled with 0
     */
    addAColumn(): Matrix {
        return new Matrix(this.rows, this.columns + 1, this.values);
    }

    /**
     * Add an new row to the matrix, filled with 0
     */
    addARow(): Matrix {
        return new Matrix(this.rows + 1, this.columns, this.values);
    }

    /**
     * Check if two matrix are equals, value by value
     * @param mat The matrix against to check equality
     */
    equals(mat: Matrix): boolean {
        // Reduce on rows -> reduce on columns -> if a value != then false!
        return (this.rows === mat.rows && this.columns === mat.columns)
            && this.values.reduce(// Rows
                (eql: boolean, row, i) => eql && row.reduce(// Columns (real values)
                    (eql2: boolean, val, j) => eql2 && mat.at(i, j) === val, eql)
                , true);
    }

    /**
     * Sets the matrix as an identity matrix
     */
    setAsIdentity() {
        if (this.rows !== this.columns) throw new Error("The matrix isn't squared!");
        this.values.forEach((row, i) => {
            row.forEach((c, j) => {
                this.values[i][j] = i === j ? 1 : 0;
            });
        });
        return this;
    }

    /**
     * Gets an identity matrix (1 on diagonal)
     * @param dimension Dimension of the squared matrix
     */
    static identity(dimension: number): Matrix {
        if (dimension < 1) throw Error('Matrix dimension must be positive.');
        return new Matrix(dimension, dimension).setAsIdentity();
    }

    /**
     * Computes the product with another matrix
     * @param mat The second operand matrix
     * @throws Error if matrixA.columns != matrixB.rows
     */
    multiply(mat: Matrix): Matrix {
        if (this.columns !== mat.rows) throw new Error("The operand matrix must have the same number of rows as 'this' matrix columns!");
        const resMatrix = new Matrix(this.rows, mat.columns);
        resMatrix.values = resMatrix.values.map((row, i) => {
            return row.map((val, j) => {
                return this.values[i].reduce((sum, elm, k) => sum + (elm * mat.at(k, j)), 0);
            });
        });
        return resMatrix;
    }

    /**
     * Computes the determinant of the matrix
     * @throws Error if the matrix is not squared
     */
    determinant(): number {
        if (this.rows !== this.columns) throw new Error("The matrix isn't squared!");
        let det = 0;
        let sign = 1;
        if (this.rows === 2) {
            det = this.values[0][0] * this.values[1][1] - this.values[1][0] * this.values[0][1];
        } else {
            for (let i = 0; i < this.rows; i++) {
                const minor = this.getCofactor(0, i);
                det += sign * this.at(0, i) * minor.determinant();
                sign = -sign;
            }
        }
        return det;
    }

    /**
     * Gets a cofactor matrix
     * @param row The row to omit in the matrix
     * @param col The column to omit in the matrix
     * @return The cofactor matrix sized (n-1)x(n-1)
     */
    getCofactor(row: number, col: number): Matrix {
        return new Matrix(this.rows - 1, this.columns - 1, this.values
            .filter((v, i) => i !== row) // Remove the unnecessary row
            .map((c) => c.filter((v, i) => i !== col)));
    }

    /**
     * Computes a transposed the matrix
     * @return A new matrix sized (columns) x (rows)
     */
    transpose(): Matrix {
        return new Matrix(this.columns, this.rows, new Array<number[]>(this.columns).fill([])
            .map((row, i) => new Array<number>(this.rows).fill(0).map((c, j) => this.at(j, i))));
    }

    /**
     * Computes the inversed matrix
     * @return A new matrix inversed
     */
    inverse() {
        if (this.rows !== this.columns) throw new Error("The matrix isn't squared!");
        const det = this.determinant();
        if (det === 0) throw new Error("Determinant is 0, can't compute inverse.");

        // Get cofactor matrix
        let sign = -1;
        const cofactor = new Matrix (this.rows, this.columns,
            this.values.map((row, i) => row.map((val, j) => {
                sign *= -1;
                return sign * this.getCofactor(i, j).determinant();
            })));
        // Transpose it
        const transposedCofactor = cofactor.transpose();
        // Compute inverse of transposed / determinant on each value
        return new Matrix(this.rows, this.columns,
            this.values.map((row, i) => row.map((val, j) => transposedCofactor.at(i, j) / det)));
    }

}