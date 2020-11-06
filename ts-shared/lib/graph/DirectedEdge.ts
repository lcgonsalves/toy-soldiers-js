import IComparable from "../util/IComparable";
import Node from "../graph/Node";
import {Vector} from "ts-matrix";

/** Encodes a connection between a source and a destination */
export default class DirectedEdge implements IComparable {
    get to(): Node {
        return this._to;
    }
    get from(): Node {
        return this._from;
    }

    get toVector(): Vector {
        return this.from.vector(this.to);
    }

    /** gets id corresponding to the pair of nodes associated by this edge */
    get id(): string {
        return `${this.from.id}->${this.to.id}`
    }

    private readonly _from: Node;
    private readonly _to: Node;

    constructor(from: Node, to: Node) {
        this._from = from;
        this._to = to;
    }

    public toString(): string {
        return `${this._from.toString()} -> ${this._to.toString()}`
    }

    equals(other: DirectedEdge): boolean {
        return this._to.equals(other._to) && this._from.equals(other._from);
    }
}