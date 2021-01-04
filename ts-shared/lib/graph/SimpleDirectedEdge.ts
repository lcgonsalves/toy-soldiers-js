import {EdgeInstantiator, IGraphEdge, IGraphNode} from "./GraphInterfaces";
import {ICoordinate} from "../geometry/Coordinate";
import {ILine, Line} from "../geometry/Line";
import Vector from "../util/Vector";
import IComparable from "../util/IComparable";

export default class SimpleDirectedEdge<
    FromNode extends IGraphNode,
    ToNode extends IGraphNode
    > implements IGraphEdge<FromNode, ToNode> {

    private readonly _from: FromNode;
    private readonly _to: ToNode;

    constructor(from: FromNode, to: ToNode) {
        this._from = from;
        this._to = to;
    }

    get from(): FromNode {
        return this._from;
    }


    get to(): ToNode {
        return this._to;
    }


    get id(): string {
        return `${this.from.id}=>${this.to.id}`;
    }

    get midpoint(): ICoordinate {
        return this.from.midpoint(this.to);
    }

    get size(): number {
        return this.from.distance(this.to);
    }

    get toLine(): ILine {
        return Line.from(this.from, this.to);
    }

    get toVector(): Vector {
        return this.from.vectorTo(this.to);
    }

    equals(other: IComparable): boolean {
        if (!(other instanceof SimpleDirectedEdge)) return false;
        return this.from.equals(other.from) && this.to.equals(other.to);
    }

    shortestDistanceBetween(point: ICoordinate): number {
        return Line.from(this.from, this.to).shortestDistanceBetween(point);
    }

}

/**
 * Generic instantiator function.
 * @param {E} edgeImpl the implementation of an edge
 * @constructor
 * @protected
 */
export function instantiateEdge<
    FN extends IGraphNode,
    TN extends IGraphNode,
    E extends IGraphEdge<FN, TN>
> (edgeImpl: new (FN, TN) => E): EdgeInstantiator<FN, TN, E> {
    return (from: FN, to: TN): E => new edgeImpl(from, to);
}

export function Edge<
    FN extends IGraphNode,
    TN extends IGraphNode
    >(from: FN, to: TN): IGraphEdge<FN, TN> { return instantiateEdge(SimpleDirectedEdge)(from, to) }
