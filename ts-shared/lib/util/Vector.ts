import {Vector as TSVector} from "ts-matrix";
import Matrix from "./Matrix";
import ICoordinate from "../geometry/ICoordinate";
import Coordinate from "../geometry/Coordinate";

export default class Vector extends TSVector {

    // TODO: handle more than two dimensional
    /** returns coordinate equivalent of Vector if two dimensional. Otherwise returns undefined */
    get toCoordinate(): ICoordinate | undefined {
        if (this.rows !== 2) return undefined;
        const [x, y]= this.values;
        return new Coordinate(x, y);
    }

    /** returns Matrix equivalent of a vector */
    get toMatrix(): Matrix {
        return new Matrix(this.rows, 1, this.values.map(val => [val]));
    }

}