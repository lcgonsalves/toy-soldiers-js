import IComparable from "../util/IComparable";
import Node from "./Node";
import {Interval} from "../geometry/Interval";
import {Coordinate, ICoordinate} from "../geometry/Coordinate";
import DirectedEdge from "./DirectedEdge";

export default class DirectedGraph implements IComparable {
    private readonly _nodes: {
        [id: string]: Node
    } = {};
    private _isSnappingNodesToGrid: boolean = false;
    private static readonly xDomain: Interval = new Interval(-100, 100);
    private static readonly yDomain: Interval = new Interval(-100, 100);
    private static readonly step: number = 10;

    constructor(...nodes: Node[]) {
        nodes.forEach(n => this._nodes[n.id] = n);
    }

    get nodes(): Node[] { return Object.values(this._nodes) }
    get isSnappingNodesToGrid(): boolean { return this._isSnappingNodesToGrid; }
    set isSnappingNodesToGrid(value: boolean) { this._isSnappingNodesToGrid = value; }
    get domain(): {
        x: Interval,
        y: Interval
    } {
        return {
            x: DirectedGraph.xDomain,
            y: DirectedGraph.yDomain
        };
    }
    get step(): number { return DirectedGraph.step }

    public toString(): string {
        return this.nodes.map(n => n.toString()).reduce( (acc, cur) => acc + "\n" + cur );
    }

    /**
     * Returns true if graph contains a given node.
     *
     * @param n
     */
    public contains(n: Node): boolean {
        const node = this.nodes[n.id];
        return node && n.equals(n);
    }

    /**
     * Returns given node if it exists in the graph. If node doesn't
     * exist, an error is thrown.
     *
     * @param n
     */
    public get(n: Node): Node {
        if (this.contains(n)) return this.nodes[n.id];
        else throw new Error("Node is not contained in the graph!");
    }

    /**
     * Returns given node if it exists in the graph. If node doesn't
     * exist, else is returned.
     *
     * @param n
     * @param fallbackValue
     */
    public getOrElse<T>(n: Node, fallbackValue: T): Node | T {
        if (!this.contains(n)) return fallbackValue;
        else return this.get(n);
    }

    /**
     * Adds node(s) to the graph if not yet contained. If a node is already contained,
     * this function updates the edges of that node to the new one.
     *
     * @param n
     */
    public addNode(...n: Node[]): DirectedGraph {
        n.forEach(node => {
            if (this._isSnappingNodesToGrid) {
                const {x, y} = DirectedGraph.snapToGrid(node.x, node.y);
                node.moveTo(x,y);
            }

            if ( !DirectedGraph.xDomain.contains(node.x) || !DirectedGraph.yDomain.contains(node.y) )
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
     * @returns {Node} the newly added node
     */
    public addNodeAt(x: number, y: number, id: string): Node {
        const n = new Node(id, x, y);
        this.addNode(n);
        return n;
    }

    /**
     * For a given node n, if it is already contained by the graph, update its edges.
     * Otherwise, add it to the graph.
     *
     * @param n the node
     */
    private findAndUpdateEdges(n: Node): Node {
        return this.get(n).updateEdges(n);
    }

    /** Helper method to move coordinates in accordance to domain, range and step */
    public static snapToGrid(x: number, y: number): ICoordinate {
        let snappedX: number = Math.round(x),
            snappedY: number = Math.round(y);

        let remainderX: number = snappedX % DirectedGraph.step,
            remainderY: number = snappedY % DirectedGraph.step;

        // local helpers
        const correctRemainderSign = rem => rem < DirectedGraph.step / 2 ? -rem : DirectedGraph.step - rem;
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

        snappedX = snap(DirectedGraph.xDomain, snappedX, remainderX);
        snappedY = snap(DirectedGraph.yDomain, snappedY, remainderY);

        return new Coordinate(snappedX, snappedY);

    }

    /**
     * Adds a pair of nodes to the graph and connects them. If either of the nodes already
     * exists, it will be connected to the other. If both already exist, they will be connected to each other.
     *
     * @param {Node} n1 Starting node if unidirectional
     * @param {Node} n2 Ending node if unidirectional
     * @param {boolean} bidirectional false if unidirectional
     * @returns {Node} the second node, or ending node if unidirectional
     */
    public addAndConnect(n1: Node, n2: Node, bidirectional: boolean = false): DirectedGraph {
        let firstNode: Node, secondNode: Node;

        firstNode = this.getOrElse(n1, n1);
        secondNode = this.getOrElse(n2, n2);

        firstNode.connectTo(secondNode, bidirectional);

        // adds if they don't exist yet
        return this.addNode(firstNode, secondNode);
    }

    /** returns an array of nodes whose position intersects with the given edge */
    public getNodesIntersectingWith(edge: DirectedEdge): Node[] {
        return this.nodes.filter(n => (
            !(n.equals(edge.from) || n.equals(edge.to)) && edge.intersects(n)
        ));
    }

    equals(other: DirectedGraph): boolean {
        return Object.values(this._nodes).every(other.contains);
    }

    /** returns true if there is a node at a given location */
    public containsNodeAtPosition(location: ICoordinate): boolean {
        return this.nodes.filter(_ => _.overlaps(location)).length > 0
    }

}