"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_matrix_1 = require("ts-matrix");
const Coordinate_1 = require("../geometry/Coordinate");
class UnitConverter {
    /** Converts a vector to a matrix */
    static vectorToMatrix(vec) {
        return new ts_matrix_1.Matrix(vec.rows, 1, vec.values.map(val => [val]));
    }
    /** Converts a matrix to a vector if the matrix has 1 column */
    static matrixToVector(matrix) {
        if (matrix.columns > 1)
            throw new Error("Cannot convert a matrix with more than 1 column!");
        return new ts_matrix_1.Vector(matrix.values.map(_ => _[0]));
    }
    static vectorToCoordinate(vec) {
        if (vec.rows !== 2)
            throw Error("Cannot convert a vector unless it has 2 dimensions!");
        const [x, y] = vec.values;
        return new Coordinate_1.default(x, y);
    }
}
exports.default = UnitConverter;
//# sourceMappingURL=UnitConverter.js.map