import AbstractNode from "./AbstractNode";
import {IGraphNode} from "./GraphInterfaces";
import {Coordinate, ICoordinate} from "../geometry/Coordinate";
import {ISnappable} from "../util/ISnappable";
import WorldContext from "../mechanics/WorldContext";

/**
 * Represents a location or position on the map.  Is instantialized at (0,0) by default.
 */
export default class LocationNode extends AbstractNode implements IWorldNode, ISnappable {

    readonly key: string = "location";

    constructor(id: string, position: ICoordinate = Coordinate.origin, name: string = "untitled") {
        super(id, position.x, position.y, 2);

        this._name = name;

    }

    protected _name: string;

    get name(): string {
        return this._name;
    }

    rename(value: string): this {
        this._name = value;
        return this;
    }

    get adjacent(): IGraphNode[] {
        return super.adjacent;
    }

    /** A shallow copy of the LocationNode, matching in ID and location */
    get copy(): this {
        // @ts-ignore
        return new this.LocationNode(this.id);
    }

    connectTo<N extends IGraphNode>(other: N, bidirectional?: boolean): IGraphNode {
        return super.connectTo(other, bidirectional);
    }

    toString(): string {
        return `${this.constructor.name}${super.toString()}`;
    }

    snapSelf(): void {
        this.worldContext.snap(this);
    }

    private _worldContext: WorldContext<IGraphNode>;

    get worldContext(): WorldContext<IGraphNode> {
        return this._worldContext;
    }

    associate(worldContext: WorldContext<IGraphNode>): this {
        this._worldContext = worldContext;
        return this;
    }

}

export interface IWorldNode extends IGraphNode {

    /** identifier for kind of node */
    readonly key: string;

    readonly worldContext: WorldContext<IGraphNode>;

    /** Associates this node to a world context. */
    associate(worldContext: WorldContext<IGraphNode>): this;

}
