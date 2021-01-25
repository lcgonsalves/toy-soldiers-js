import {Coordinate} from "../geometry/Coordinate";
import {IGraphEdge, IGraphNode} from "./GraphInterfaces";
import {Edge} from "./SimpleDirectedEdge";
import WorldContext from "../mechanics/WorldContext";

export default abstract class AbstractNode
    extends Coordinate implements IGraphNode {

    protected readonly _edges: Map<IGraphNode, IGraphEdge<IGraphNode, IGraphNode>> = new Map();
    protected readonly _id: string;
    protected readonly _radius: number;
    private _worldContext: WorldContext<IGraphNode>;

    get worldContext(): WorldContext<IGraphNode> {
        return this._worldContext;
    }
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
    set worldContext(value: WorldContext<IGraphNode>) {
        this._worldContext = value;
    }


    protected constructor(id: string, x: number, y: number, radius: number) {
        super(x, y);
        this._id = id;
        this._radius = radius;
    }

    /**
     * Associates this node to a world context. I don't know why I'm naming it so
     * cryptically. :D
     * @param worldContext
     */
    associate<Node extends AbstractNode, Context extends WorldContext<Node>>(worldContext: Context): AbstractNode {
        this.worldContext = worldContext;
        return this;
    }

    connectTo<N extends IGraphNode>(other: N, bidirectional?: boolean): IGraphNode {
        if (!this.isAdjacent(other)) this._edges.set(other, Edge<AbstractNode, N>(this, other));
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