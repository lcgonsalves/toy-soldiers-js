import DirectedEdge from "./DirectedEdge";
import { ICoordinate } from "../geometry/Coordinate";
import Vector from "../util/Vector";
export default class Node implements ICoordinate {
    private readonly _coordinate;
    private readonly _id;
    private _edges;
    private _radius;
    private _bufferRadius;
    get y(): number;
    get x(): number;
    get edges(): DirectedEdge[];
    get coord(): ICoordinate;
    get id(): string;
    get radius(): number;
    set radius(value: number);
    get vector(): Vector;
    get bufferRadius(): number;
    set bufferRadius(value: number);
    constructor(id: string, x: number, y: number, edges?: DirectedEdge[]);
    /** returns midpoint between two nodes */
    midpoint(other: ICoordinate): ICoordinate;
    /** returns distance between two nodes */
    distance(other: ICoordinate): number;
    /** returns vector between two nodes */
    vectorTo(other: ICoordinate): Vector;
    /** reassigns this Node's coordinate to a new value */
    moveTo(x: number, y: number): Node;
    /** Converts the node and its immediate connections to a string */
    toStringComplex(): string;
    /** Converts the node to a simple string with no edges */
    toStringSimple(): string;
    /** Returns true if the node has the same coordinates. */
    equals(other: Node): boolean;
    /** Updates edges of this node to be the same as a template. Template must pass _.equals() validation */
    updateEdges(template: Node): Node;
    /**
     * Returns true if other node is directly accessible from this node.
     * O(edges.length)
     *
     */
    isAdjacent(other: Node): boolean;
    /** Gets all the nodes immediately adjacent to this. */
    getAdjacent(): Node[];
    /**
     * Connects this node to other node.
     *
     * @param {Node} other target node
     * @param {boolean} bidirectional optional – whether the connection should work both ways
     * @returns {Node} this node (for chaining connections)
     */
    connectTo(other: Node, bidirectional?: boolean): Node;
    overlaps(other: ICoordinate): boolean;
    perpendicularVector(other: ICoordinate, ccw?: boolean): Vector;
    moveBy(x: number, y: number): Node;
}
