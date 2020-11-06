import IComparable from "../util/IComparable";
import Node from "../graph/Node";
import { Vector } from "ts-matrix";
/** Encodes a connection between a source and a destination */
export default class DirectedEdge implements IComparable {
    get to(): Node;
    get from(): Node;
    get toVector(): Vector;
    /** gets id corresponding to the pair of nodes associated by this edge */
    get id(): string;
    private readonly _from;
    private readonly _to;
    constructor(from: Node, to: Node);
    toString(): string;
    equals(other: DirectedEdge): boolean;
}
