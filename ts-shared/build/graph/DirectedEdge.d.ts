import IComparable from "../util/IComparable";
import Node from "../graph/Node";
/** Encodes a connection between a source and a destination */
export default class DirectedEdge implements IComparable {
    get to(): Node;
    get from(): Node;
    private readonly _from;
    private readonly _to;
    constructor(from: Node, to: Node);
    toString(): string;
    equals(other: DirectedEdge): boolean;
}
