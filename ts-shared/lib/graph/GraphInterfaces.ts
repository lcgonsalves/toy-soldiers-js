import {ICoordinate} from "../geometry/Coordinate";
import Vector from "../util/Vector";
import {ILine} from "../geometry/Line";
import IComparable from "../util/IComparable";

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
    extends ICoordinate, IComparable {

    /** returns edges of this node */
    readonly edges: IGraphEdge<IGraphNode, IGraphNode>[];
    /** returns nodes accessible from this node */
    readonly adjacent: IGraphNode;
    /** returns unique identifier of this node */
    readonly id: string;
    /** edge to string conversion */
    readonly toString: string;
    /** the physical size of this node */
    radius: number;

    /**
     * Connects this GraphNode to other GraphNode.
     *
     * @param {IGraphNode} other node to which this graph node should connect to
     * @param {boolean} bidirectional optional – whether the connection should work both ways
     * @returns {IGraphNode} this node (for chaining)
     */
    connectTo<N extends IGraphNode>(other: N, bidirectional?: boolean): IGraphNode;

    /**
     * Disconnects this GraphNode from other GraphNode.
     *
     * @param {IGraphNode} other node to which this node should disconnect from.
     * @param {boolean} bidirectional optional – whether this node should be removed from the other's connections.
     * @returns {IGraphNode} this node (for chaining)
     */
    disconnectFrom<N extends IGraphNode>(other: N, bidirectional?: boolean): IGraphNode;

    /**
     * Returns true if other node is directly accessible from this node.
     * O(edges.length)
     *
     * @param {IGraphNode} other node to be compared.
     */
    isAdjacent(other: IGraphNode): boolean;
}

/**
 * Defines a connection between two graph nodes, which can have different implementations.
 */
export interface IGraphEdge<FromNode extends IGraphNode, ToNode extends IGraphNode>
    extends ILine, IComparable {

    /** source node */
    readonly from: FromNode;
    /** destination node */
    readonly to: ToNode;
    /** unique identifier */
    readonly id: string;
    /** edge to Vector conversion */
    readonly toVector: Vector;
    /** edge to Line conversion */
    readonly toLine: ILine;
    /** Point equidistant from both nodes */
    readonly midpoint: ICoordinate;
    /** size of a vector from the source to the destination node */
    readonly size: number;
    /** edge to string conversion */
    readonly toString: string;

}

/**
 * Defines a set of nodes and some helpers.
 */
export interface IGraph<
    Node extends IGraphNode
    > extends IComparable {

    /** set of nodes contained in graph */
    readonly nodes: Node[];


}

