import IComparable from "../util/IComparable";
import Node from "./Node";
export default class DirectedGraph implements IComparable {
    private _nodes;
    readonly domain: [number, number];
    constructor(...nodes: Node[]);
    get nodes(): Node[];
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
    getOrElse(n: Node, fallbackValue: any): Node | any;
    /**
     * Adds node(s) to the graph if not yet contained. If a node is already contained,
     * this function updates the edges of that node to the new one.
     *
     * @param n
     */
    addNode(...n: Node[]): DirectedGraph;
    /**
     * Given a set of coordinates
     * @param x
     * @param y
     * @param id
     */
    addNodeAt(x: number, y: number, id?: string): Node;
    /**
     * For a given node n, if it is already contained by the graph, update its edges.
     * Otherwise, add it to the graph.
     *
     * @param n the node
     */
    private findAndUpdateEdges;
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
    equals(other: DirectedGraph): boolean;
}
