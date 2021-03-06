import {ICoordinate} from "../geometry/Coordinate";
import IComparable from "../util/IComparable";
import Domain from "../geometry/Domain";
import {ISerializable} from "../util/ISerializable";
import EMap from "../util/EMap";
import {Observable, Subscription} from "rxjs";

/**
 * Generically describes items that have graph node properties. They can be
 * added to graphs, connected to other nodes, etc.
 *
 * Graph nodes have a physical location and radius.
 *
 * Nodes are contextual, meaning they are aware of their edges, and therefore
 * are also aware of neighboring nodes.
 */
export interface IGraphNode
    extends ICoordinate, IComparable, ISerializable {

    // attributes and getters

    /** returns nodes accessible from this node */
    readonly adjacent: this[];
    /** returns unique identifier of this node */
    readonly id: string;
    /** @deprecated use depiction to determine size
     * the physical size of this node */
    radius: number;

    // methods

    /**
     * Connects this GraphNode to other GraphNode.
     *
     * @param {IGraphNode} other node to which this graph node should connect to
     * @param {boolean} bidirectional optional – whether the connection should work both ways
     * @returns {IGraphNode} this node (for chaining)
     */
    connectTo(other: this, bidirectional?: boolean): this;

    /**
     * Disconnects this GraphNode from other GraphNode.
     *
     * @param {IGraphNode} other node to which this node should disconnect from.
     * @param {boolean} bidirectional optional – whether this node should be removed from the other's connections.
     * @returns {IGraphNode} this node (for chaining)
     */
    disconnectFrom(other: IGraphNode, bidirectional?: boolean): this;

    /**
     * Returns true if other node is directly accessible from this node.
     * O(edges.length)
     *
     * @param {IGraphNode} other node to be compared.
     */
    isAdjacent(other: IGraphNode): boolean;

    /** corresponding string representation */
    toString(): string;

}


/**
 * Defines a set of nodes and some helpers.
 */
export interface IGraph<Node extends IGraphNode>
    extends IComparable {

    // attributes and getters

    /** set of nodes contained in graph */
    readonly nodes: EMap<string, Node>;
    /** the values of x & y allowed for nodes */
    readonly domain: Domain;

    // methods

    /**
     * Returns true if the graph contains the given node or a node
     * with the given ID.
     *
     * @param {DeprecatedNode | string} target a string representing the node ID or a reference to the node.
     */
    contains(target: Node | string): boolean;

    /**
     * Returns the graph node with the given ID if the graph contains the node, or
     * undefined if it doesn't contain the node.
     *
     * @param {string} id the ID of the node to be retrieved.
     */
    get(id: string): Node | undefined;

    /**
     * Returns node with given ID if it exists in the graph. If node doesn't
     * exist, fallbackValue is returned.
     *
     * @param n
     * @param fallbackValue
     */
    getOrElse<T>(id: string, fallbackValue: T): Node | T;

    /**
     * Adds node(s) to the graph if not yet contained. If a node is already contained,
     * no action will be performed.
     *
     * @param {DeprecatedNode[]} n the node or nodes to be added.
     * @returns {IGraph} instance of the graph, for chaining.
     */
    add(...n: Node[]): IGraph<Node>;

    /** removes nodes with given ID(s) */
    rm(...n: string[]): IGraph<Node>;

    /**
     * Replaces existing node in the graph with given node. ID must be the same.
     * If graph doesn't contain a node with equivalent ID, node will simply be added to the
     * graph. Existing connections to the node-to-be-replaced will be deleted.
     *
     * @param {DeprecatedNode} n The node to be replaced.
     * @param {boolean} reconnect When true, existing nodes that were connected with the previous node
     *                              will be reconnected to the new node.
     */
    replace(n: Node, reconnect?: boolean): IGraph<Node>;

    /**
     * Retrieves all nodes located inside a circle centered at `center` and within
     * a projected circle of radius `radius`. If no nodes are in the vicinity, return an empty array.
     *
     * @param {ICoordinate} center
     * @param {number} radius
     */
    getNodesInVicinity(center: ICoordinate, radius: number): Node[];

    /**
     * Returns true if there are nodes located inside a circle centered at `center` and within
     * a projected circle of radius `radius`.
     *
     * @param {ICoordinate} center
     * @param {number} radius
     */
    containsNodesInVicinity(center: ICoordinate, radius: number): boolean;

    /**
     * Returns nodes in this graph who have an edge
     * connecting to this node.
     * @param nodeID
     */
    getNodesAdjacentTo(node: IGraphNode): Node[];

    /**
     * Retrieves nodes at a given coordinate, if they exists.
     *
     * @param {ICoordinate} location
     */
    getNodesAtPosition(location: ICoordinate): Node[];

    /**
     * Retrieves node at a given coordinate, if one exists. Otherwise returns undefined.
     *
     * @param {ICoordinate} location
     */
    getNodeAtPosition(location: ICoordinate): Node | undefined;

    /** returns true if there is a node at a given location */
    containsNodeAtLocation(location: ICoordinate): boolean;

    /**
     * If "from" is connected to "to", returns any nodes that are
     * intersecting with the edge. Otherwise returns an empty array.
     *
     * @param e
     */
    getNodesIntersecting(from: IGraphNode, to: IGraphNode): IGraphNode[];

    // observables

    /**
     * Fires events every time a node is added, containing the instance of the node
     * that was added.
     */
    readonly $add: Observable<Node[]>;

    /**
     * Fires events every time a node is removed, containing the instance of the node
     * that was added.
     */
    readonly $rm: Observable<Node[]>;

    /**
     * Watches node additions to the graph.
     * @param observer
     */
    onAdd(observer: (node: Node[]) => void): Subscription;

    /**
     * Watches node removals from the graph.
     * @param observer
     */
    onRm(observer: (node: Node[]) => void): Subscription;

}

/**
 * When u connectTo but pass a node of the wrong type.
 */
export class IncompatibleTargetError extends Error {

    constructor(message?: string) {
        super("Target of connection is incompatible" + message ? `: ${message}` : ".");
    }

}
