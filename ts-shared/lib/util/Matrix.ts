import {Matrix as TSMatrix} from "ts-matrix";
import Vector from "./Vector";

export default class Matrix extends TSMatrix {
    /** If Matrix has a Vector equivalent, returns Vector. Otherwise result is undefined */
    get toVector(): Vector | undefined {
        if (this.columns > 1) return undefined;
        return new Vector(this.values.map(_ => _[0]));
    }

}