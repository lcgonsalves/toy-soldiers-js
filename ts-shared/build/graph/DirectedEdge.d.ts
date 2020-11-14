import IComparable from "../util/IComparable";
import { ICoordinate } from "../geometry/Coordinate";
import Node from "../graph/Node";
import Vector from "../util/Vector";
import { ILine, Line } from "../geometry/Line";
/** Encodes a connection between a source and a destination */
export default class DirectedEdge implements ILine {
    private readonly _from;
    private readonly _to;
    get to(): Node;
    get from(): Node;
    get id(): string;
    get toVector(): Vector;
    get toLine(): Line;
    get midpoint(): ICoordinate;
    get size(): number;
    constructor(from: Node, to: Node);
    toString(): string;
    equals(other: IComparable): boolean;
    /** Returns coordinate of point (x1,y1) as defined in the usage of d3.path().arcTo() from a given curvature degree parameter */
    getArcToTangentPoint(intersectingNode?: Node): ICoordinate;
    /** returns radius needed for a when given an intersecting node */
    getCurveRadius(intersectingNode?: Node): number;
    shortestDistanceBetween(point: ICoordinate): number;
    /** determines if a given Node is collinear (intersects, collides) with a straight line between
     * the nodes of this edge */
    intersects(node: Node): boolean;
}
