import I2DPoint from "../geometry/I2DPoint";
import Coordinate from "../geometry/Coordinate";
import DirectedEdge from "./DirectedEdge";
export default class Node implements I2DPoint {
    private readonly _coordinate;
    private readonly _id;
    private edges;
    get y(): number;
    get x(): number;
    get coord(): Coordinate;
    get id(): string;
    constructor(id: string, x: number, y: number, edges?: DirectedEdge[]);
    /** returns midpoint between two nodes */
    midpoint(other: Node): Coordinate;
    /** returns distance between two nodes */
    distance(other: Node): number;
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
}
