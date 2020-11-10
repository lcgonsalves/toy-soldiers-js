import IComparable from "../util/IComparable";
import Node from "../graph/Node";
import Vector from "../util/Vector";
import ICoordinate from "../../build/geometry/ICoordinate";

/** Encodes a connection between a source and a destination */
export default class DirectedEdge implements IComparable {
    private readonly _from: Node;
    private readonly _to: Node;
    get to(): Node { return this._to; }
    get from(): Node { return this._from; }
    get toVector(): Vector { return this.from.vector(this.to); }
    get id(): string { return `${this.from.id}->${this.to.id}` }

    constructor(from: Node, to: Node) {
        this._from = from;
        this._to = to;
    }

    public toString(): string {
        return `${this._from.toString()} -> ${this._to.toString()}`
    }

    equals(other: IComparable): boolean {
        return other instanceof DirectedEdge && this._to.equals(other._to) && this._from.equals(other._from);
    }

    /** Returns coordinate of point (x1,y1) as defined in the usage of d3.path().arcTo() from a given degree parameter */
    getArcTangentPoint(degree: number = 10): ICoordinate {
        const {from, to} = this;

        const midpoint = from.midpoint(to);
        const perpendicularVectorMTo = from.perpedicularVector(midpoint);
        const radius = Math.sqrt(Math.pow(degree, 2) + Math.pow(from.vector(midpoint).length(), 2));
        const ratio = perpendicularVectorMTo.length() / degree;
        const finalVector = perpendicularVectorMTo.scale(ratio).add(perpendicularVectorMTo);
        const tangentPoint: ICoordinate = null;

        return tangentPoint;
    }
}