import IComparable from "../util/IComparable";
import Node from "../graph/Node";
import Vector from "../util/Vector";
import ICoordinate from "../../build/geometry/ICoordinate";
/** Encodes a connection between a source and a destination */
export default class DirectedEdge implements IComparable {
    private readonly _from;
    private readonly _to;
    get to(): Node;
    get from(): Node;
    get toVector(): Vector;
    get id(): string;
    constructor(from: Node, to: Node);
    toString(): string;
    equals(other: IComparable): boolean;
    /** Returns coordinate of point (x1,y1) as defined in the usage of d3.path().arcTo() from a given degree parameter */
    getArcTangentPoint(degree?: number): ICoordinate;
}
