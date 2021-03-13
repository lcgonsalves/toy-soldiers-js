import AbstractNode from "./AbstractNode";
import {IGraphNode} from "./GraphInterfaces";

/**
 * Represents a location or position on the map.  Is instantialized at (0,0) by default.
 */
export default class LocationNode extends AbstractNode implements IGraphNode {

    constructor(id: string, radius: number, x?: number, y?: number) {
        const initX = x ? x : 0;
        const initY = y ? y : 0;

        super(id, initX, initY, radius);

    }

    get adjacent(): IGraphNode[] {
        return super.adjacent;
    }

    /** A shallow copy of the LocationNode, matching in ID and location */
    get copy(): this {
        // @ts-ignore
        return new this.constructor(this.id, this.radius, this.x, this.y);
    }

    connectTo<N extends IGraphNode>(other: N, bidirectional?: boolean): IGraphNode {
        return super.connectTo(other, bidirectional);
    }

    toString(): string {
        return `${this.constructor.name}${super.toString()}`;
    }

}
