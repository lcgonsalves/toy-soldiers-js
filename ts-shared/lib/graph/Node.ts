import DirectedEdge from "./DirectedEdge";
import {Coordinate, ICoordinate} from "../geometry/Coordinate";
import Vector from "../util/Vector";

export default class Node implements ICoordinate {
    private readonly _coordinate: ICoordinate;
    private readonly _id: string;
    private _edges: DirectedEdge[];
    private _radius: number = 2.5;
    private _bufferRadius: number = 1.5;

    get y(): number { return this._coordinate.y; }
    get x(): number { return this._coordinate.x; }
    get edges(): DirectedEdge[] { return this._edges; }
    get coord(): ICoordinate { return this._coordinate; }
    get id(): string { return this._id; }
    get radius(): number { return this._radius; }
    set radius(value: number) { this._radius = value; }
    get vector(): Vector { return new Vector([this.coord.x, this.coord.y]); }
    get bufferRadius(): number { return this._bufferRadius; }
    set bufferRadius(value: number) { this._bufferRadius = value; }

    constructor(id: string, x: number, y: number, edges: DirectedEdge[] = []) {
        this._id = id;
        this._coordinate = new Coordinate(x, y);
        this._edges = edges;
    }

    /** returns midpoint between two nodes */
    public midpoint(other: ICoordinate): ICoordinate {
        return this._coordinate.midpoint(other);
    }

    /** returns distance between two nodes */
    public distance(other: ICoordinate): number {
        return this._coordinate.distance(other);
    }

    /** returns vector between two nodes */
    public vectorTo(other: ICoordinate): Vector {
        return this.coord.vectorTo(other);
    }

    /** reassigns this Node's coordinate to a new value */
    public moveTo(x: number, y: number): Node {
        this._coordinate.moveTo(x, y);
        return this;
    }

    /** Converts the node and its immediate connections to a string */
    public toStringComplex(): string {
        const destinations = this._edges.map(e => e.to.toStringSimple());

        if (this._edges.length === 0 || destinations.length === 0) return `(${this.x}, ${this.y})`;

        return `[${this._id}](${this.x}, ${this.y}) -> ${destinations.reduce((acc, cur) => acc + ", " + cur)}`;
    }

    /** Converts the node to a simple string with no edges */
    public toStringSimple(): string {
        return `[${this._id}](${this.x}, ${this.y})`
    }

    /** Returns true if the node has the same coordinates. */
    public equals(other: Node): boolean {
        return this._id === other._id;
    }

    /** Updates edges of this node to be the same as a template. Template must pass _.equals() validation */
    public updateEdges(template: Node): Node {
        if (!template.equals(this))
            throw new Error("Cannot update edges from a different Node! Nodes must .equals() each other.");

        // TODO: do I need to verify if edges.from() all match this??
        this._edges = template._edges;

        return this;
    }

    /**
     * Returns true if other node is directly accessible from this node.
     * O(edges.length)
     *
     */
    isAdjacent(other: Node): boolean {
        return !!this._edges.find(edge => edge.to.equals(other));
    }

    /** Gets all the nodes immediately adjacent to this. */
    getAdjacent(): Node[] {
        return this._edges.map(edge => edge.to);
    }

    /**
     * Connects this node to other node.
     *
     * @param {Node} other target node
     * @param {boolean} bidirectional optional – whether the connection should work both ways
     * @returns {Node} this node (for chaining connections)
     */
    connectTo(other: Node, bidirectional: boolean = false): Node {
        if (bidirectional) other.connectTo(this);
        if (!this.isAdjacent(other)) {
            this._edges.push(new DirectedEdge(this, other));
        }

        return this;
    }

    overlaps(other: ICoordinate): boolean {
        // if (other instanceof Node) handle weight possibility
        return this.coord.overlaps(other);
    }

    perpendicularVector(other: ICoordinate, ccw: boolean = true): Vector {
        return this.coord.perpendicularVector(other, ccw);
    }

    moveBy(x: number, y: number): Node {
        this.coord.moveBy(x,y);
        return this;
    }

}