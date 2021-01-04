import AbstractNode from "./AbstractNode";
import {IGraphEdge, IGraphNode} from "./GraphInterfaces";

/** Acceptable destinations from LocationNode */
export type LocationNodeDestinations = LocationNode;

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

    // TODO: make destination constraints work!
    connectTo<N extends IGraphNode>(other: N, bidirectional?: boolean): IGraphNode {
        return super.connectTo(other, bidirectional);
    }

}
