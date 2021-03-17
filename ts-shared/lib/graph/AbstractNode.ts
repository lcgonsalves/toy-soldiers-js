import {Coordinate, ICoordinate} from "../geometry/Coordinate";
import {IGraphNode} from "./GraphInterfaces";
import {SerializableObject, SObj} from "../util/ISerializable";

export default abstract class AbstractNode
    extends Coordinate implements IGraphNode {

    protected readonly _edges: Map<string, this> = new Map();
    protected readonly _id: string;
    protected readonly _radius: number;

    get adjacent(): this[] {
        return [ ...this._edges.values() ];
    }

    get id(): string {
        return this._id;
    }

    /**
     * @deprecated Radius should no longer be considered since size of node is determined from its depiction.
     */
    get radius(): number {
        return this._radius;
    }

    /**
     * Shallow equals. A node's identity is not based upon the edges it is connected to, only its location
     * and identification.
     * @param other
     */
    equals(other: ICoordinate): boolean {
        return super.equals(other) && other instanceof AbstractNode && other.id === this.id;
    }

    protected constructor(id: string, x: number, y: number, radius: number) {
        super(x, y);
        this._id = id;
        this._radius = radius;
    }


    connectTo(other: this, bidirectional?: boolean): this {
        if (!this.isAdjacent(other)) this._edges.set(other.id, other);
        if (bidirectional) other.connectTo(this);
        return this;
    }

    disconnectFrom(other: this, bidirectional?: boolean): this {
        this._edges.delete(other.id);
        if (bidirectional) other.disconnectFrom(this);
        return this;
    }

    isAdjacent(other: IGraphNode): boolean {
        return this._edges.has(other.id);
    }


    /**
     * This class does not define what a copy of an abstract node looks like. You have to define
     * that when you extend this class; It also does not define what equality looks like, so overriding the
     * equals method is also recommended.
     */
    abstract get copy(): this;

    get simplified(): SerializableObject {
        return SObj({
            x: this.x,
            y: this.y,
            id: this.id,
            radius: this.radius,
            adj: this.adjacent.map(_ => _.id)
        });
    }

}