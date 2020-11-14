import IComparable from "../util/IComparable";
import Node from "./Node";
import { Interval } from "../geometry/Interval";
import { ICoordinate } from "../geometry/Coordinate";
import DirectedEdge from "./DirectedEdge";
export default class DirectedGraph implements IComparable {
    private readonly _nodes;
    private _isSnappingNodesToGrid;
    private static readonly xDomain;
    private static readonly yDomain;
    private static readonly step;
    constructor(...nodes: Node[]);
    get nodes(): Node[];
    get isSnappingNodesToGrid(): boolean;
    set isSnappingNodesToGrid(value: boolean);
    get domain(): {
        x: Interval;
        y: Interval;
    };
    get step(): number;
    toString(): string;
    /**
     * Returns true if graph contains a given node.
     *
     * @param n
     */
    contains(n: Node): boolean;
    /**
     * Returns given node if it exists in the graph. If node doesn't
     * exist, an error is thrown.
     *
     * @param n
     */
    get(n: Node): Node;
    /**
     * Returns given node if it exists in the graph. If node doesn't
     * exist, else is returned.
     *
     * @param n
     * @param fallbackValue
     */
    getOrElse<T>(n: Node, fallbackValue: T): Node | T;
    /**
     * Adds node(s) to the graph if not yet contained. If a node is already contained,
     * this function updates the edges of that node to the new one.
     *
     * @param n
     */
    addNode(...n: Node[]): DirectedGraph;
    /**
     * Adds a node to the graph at the input coordinates.
     * @param {number} x
     * @param {number} y
     * @param {string} id optional identifier for the point. if no identifier is passed, one will be generated.
     * @returns {Node} the newly added node
     */
    addNodeAt(x: number, y: number, id: string): Node;
    /**
     * For a given node n, if it is already contained by the graph, update its edges.
     * Otherwise, add it to the graph.
     *
     * @param n the node
     */
    private findAndUpdateEdges;
    /** Helper method to move coordinates in accordance to domain, range and step */
    static snapToGrid(x: number, y: number): ICoordinate;
    /**
     * Adds a pair of nodes to the graph and connects them. If either of the nodes already
     * exists, it will be connected to the other. If both already exist, they will be connected to each other.
     *
     * @param {Node} n1 Starting node if unidirectional
     * @param {Node} n2 Ending node if unidirectional
     * @param {boolean} bidirectional false if unidirectional
     * @returns {Node} the second node, or ending node if unidirectional
     */
    addAndConnect(n1: Node, n2: Node, bidirectional?: boolean): DirectedGraph;
    /** returns an array of nodes whose position intersects with the given edge */
    getNodesIntersectingWith(edge: DirectedEdge): Node[];
    equals(other: DirectedGraph): boolean;
    /** returns true if there is a node at a given location */
    containsNodeAtPosition(location: ICoordinate): boolean;
}
