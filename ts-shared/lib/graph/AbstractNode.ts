import {Coordinate} from "../geometry/Coordinate";
import {IGraphEdge, IGraphNode} from "./GraphInterfaces";
import {Edge} from "./SimpleDirectedEdge";

export default abstract class AbstractNode
    extends Coordinate implements IGraphNode {
    private readonly _edges: Map<IGraphNode, IGraphEdge<IGraphNode, IGraphNode>> = new Map();
    private readonly _id: string;
    private readonly _radius: number;

    get adjacent(): IGraphNode[] {
        return [ ...this._edges.keys() ];
    }

    get edges(): IGraphEdge<IGraphNode, IGraphNode>[] {
        return [ ...this._edges.values() ];
    }

    get id(): string {
        return this._id;
    }

    get radius(): number {
        return this._radius;
    }


    protected constructor(id: string, x: number, y: number, radius: number) {
        super(x, y);
        this._id = id;
        this._radius = radius;
    }

    connectTo<N extends IGraphNode>(other: N, bidirectional?: boolean): IGraphNode {
        if (!this.isAdjacent(other)) this._edges.set(other, Edge(this, other));
        if (bidirectional) other.connectTo(this);
        return this;
    }

    disconnectFrom<N extends IGraphNode>(other: N, bidirectional?: boolean): IGraphNode {
        this._edges.delete(other);
        return this;
    }

    isAdjacent(other: IGraphNode): boolean {
        return this._edges.has(other);
    }

}