import IComparable from "../../util/IComparable";
import DeprecatedNode from "./DeprecatedNode";
import {Interval} from "../../geometry/Interval";
import {Coordinate, ICoordinate} from "../../geometry/Coordinate";
import DeprecatedDirectedEdge from "./DeprecatedDirectedEdge";

export default class DeprecatedDirectedGraph implements IComparable {
    private readonly _nodes: {
        [id: string]: DeprecatedNode | undefined
    } = {};
    private _isSnappingNodesToGrid: boolean = false;
    private static readonly xDomain: Interval = new Interval(-100, 100);
    private static readonly yDomain: Interval = new Interval(-100, 100);
    private static readonly step: number = 10;

    constructor(...nodes: DeprecatedNode[]) {
        nodes.forEach(n => this._nodes[n.id] = n);
    }

    get nodes(): DeprecatedNode[] { return Object.values(this._nodes).filter(_ => !!_) }
    get isSnappingNodesToGrid(): boolean { return this._isSnappingNodesToGrid; }
    set isSnappingNodesToGrid(value: boolean) { this._isSnappingNodesToGrid = value; }
    get domain(): {
        x: Interval,
        y: Interval
    } {
        return {
            x: DeprecatedDirectedGraph.xDomain,
            y: DeprecatedDirectedGraph.yDomain
        };
    }
    get step(): number { return DeprecatedDirectedGraph.step }

    public toString(): string {
        return this.nodes.map(n => n.toString()).reduce( (acc, cur) => acc + "\n" + cur );
    }

    /**
     * Returns true if graph contains a given node.
     *
     * @param {DeprecatedNode | string} n a node or a string representing its ID
     */
    public contains(n: DeprecatedNode | string): boolean {
        const node = n instanceof DeprecatedNode ? this._nodes[n.id] : this._nodes[n];
        const nodesEqual = node && n instanceof DeprecatedNode && n.equals(node);
        const idsEqual = node && typeof n === "string" && n === node.id;

        return ( nodesEqual || idsEqual );
    }

    /**
     * Returns given node if it exists in the graph. If node doesn't
     * exist, an error is thrown.
     *
     * @param {DeprecatedNode | string} n either a node or a string representing its id
     */
    public get(n: DeprecatedNode | string): DeprecatedNode {
        if (this.contains(n)) return n instanceof DeprecatedNode ? this._nodes[n.id] : this._nodes[n];
        else throw new Error("Node is not contained in the graph!");
    }

    /**
     * Returns given node if it exists in the graph. If node doesn't
     * exist, else is returned.
     *
     * @param n
     * @param fallbackValue
     */
    public getOrElse<T>(n: DeprecatedNode, fallbackValue: T): DeprecatedNode | T {
        if (!this.contains(n)) return fallbackValue;
        else return this.get(n);
    }

    /**
     * Adds node(s) to the graph if not yet contained. If a node is already contained,
     * this function updates the edges of that node to the new one.
     *
     * @param n
     */
    public addNode(...n: DeprecatedNode[]): DeprecatedDirectedGraph {
        n.forEach(node => {
            if (this._isSnappingNodesToGrid) {
                const {x, y} = DeprecatedDirectedGraph.snapToGrid(node.x, node.y);
                node.translateTo(x,y);
            }

            if ( !DeprecatedDirectedGraph.xDomain.contains(node.x) || !DeprecatedDirectedGraph.yDomain.contains(node.y) )
                throw new Error("Node does not fit in the coordinate system!");

            !this.contains(node) ? this._nodes[node.id] = node : this.findAndUpdateEdges(node)
        });
        return this;
    }

    /**
     * Adds a node to the graph at the input coordinates.
     * @param {number} x
     * @param {number} y
     * @param {string} id optional identifier for the point. if no identifier is passed, one will be generated.
     * @returns {DeprecatedNode} the newly added node
     */
    public addNodeAt(x: number, y: number, id: string): DeprecatedNode {
        const n = new DeprecatedNode(id, x, y);
        this.addNode(n);
        return n;
    }

    /**
     * For a given node n, if it is already contained by the graph, update its edges.
     * Otherwise, add it to the graph.
     *
     * @param n the node
     */
    private findAndUpdateEdges(n: DeprecatedNode): DeprecatedNode {
        return this.get(n).updateEdges(n);
    }

    /** Helper method to move coordinates in accordance to domain, range and step */
    public static snapToGrid(x: number, y: number): ICoordinate {
        let snappedX: number = Math.round(x),
            snappedY: number = Math.round(y);

        let remainderX: number = snappedX % DeprecatedDirectedGraph.step,
            remainderY: number = snappedY % DeprecatedDirectedGraph.step;

        // local helpers
        const correctRemainderSign = rem => rem < DeprecatedDirectedGraph.step / 2 ? -rem : DeprecatedDirectedGraph.step - rem;
        function snap(domain: Interval, snapped: number, remainder: number) {
            if (domain.contains(snapped)) {
                snapped = remainder === 0 ? snapped : snapped + correctRemainderSign(remainder);
            } else {
                console.error("out of bounds")
                snapped = snapped > domain.max ?
                    domain.max :
                    domain.min;
            }

            return snapped;
        }

        snappedX = snap(DeprecatedDirectedGraph.xDomain, snappedX, remainderX);
        snappedY = snap(DeprecatedDirectedGraph.yDomain, snappedY, remainderY);

        return new Coordinate(snappedX, snappedY);

    }

    public static snapCoordinateToGrid(coord: ICoordinate): ICoordinate { return DeprecatedDirectedGraph.snapToGrid(coord.x, coord.y) }

    /**
     * Adds a pair of nodes to the graph and connects them. If either of the nodes already
     * exists, it will be connected to the other. If both already exist, they will be connected to each other.
     *
     * @param {DeprecatedNode} n1 Starting node if unidirectional
     * @param {DeprecatedNode} n2 Ending node if unidirectional
     * @param {boolean} bidirectional false if unidirectional
     * @returns {DeprecatedNode} the second node, or ending node if unidirectional
     */
    public addAndConnect(n1: DeprecatedNode, n2: DeprecatedNode, bidirectional: boolean = false): DeprecatedDirectedGraph {
        let firstNode: DeprecatedNode, secondNode: DeprecatedNode;

        firstNode = this.getOrElse(n1, n1);
        secondNode = this.getOrElse(n2, n2);

        firstNode.connectTo(secondNode, bidirectional);

        // adds if they don't exist yet
        return this.addNode(firstNode, secondNode);
    }

    /** given a node or node id, removes nodes */
    public removeAndDisconnect(nodeOrID: DeprecatedNode | string): DeprecatedDirectedGraph {
        if (this.contains(nodeOrID)) {
            const n = nodeOrID instanceof DeprecatedNode ? nodeOrID : new DeprecatedNode(nodeOrID, 0, 0);

            // remove from dictionary
            this._nodes[n.id] = undefined;

            // iterate over node array and disconnect
            this.nodes.forEach(node => node.disconnectFrom(n));
        }

        return this;
    }

    /** returns an array of nodes whose position intersects with the given edge */
    public getNodesIntersectingWith(edge: DeprecatedDirectedEdge): DeprecatedNode[] {
        return this.nodes.filter(n => (
            !(n.equals(edge.from) || n.equals(edge.to)) && edge.intersects(n)
        ));
    }

    equals(other: DeprecatedDirectedGraph): boolean {
        return Object.values(this._nodes).every(other.contains);
    }

    /** returns true if there is a node at a given location */
    public containsNodeAtPosition(location: ICoordinate): boolean {
        return this.nodes.filter(_ => _.overlaps(location)).length > 0
    }

}