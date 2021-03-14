import LocationNode from "../graph/LocationNode";
import {IGraphNode, IncompatibleTargetError} from "../graph/GraphInterfaces";


/**
 * Describes a location in which Pawns may be located at.
 * These define internal rules such as how many pawns may stay in them, if more pawns are generated at every turn, if it can be attacked,
 * and other stats.
 */
export class Base extends LocationNode implements IBase {

    private _occupation: number = 0;
    readonly capacity: number = 10;

    get occupation(): number {
        return this._occupation;
    }


    get adjacent(): Base[] {
        // typecast guaranteed by connectTo
        return super.adjacent as Base[];
    }

    /**
     * Connects this base to another Base.
     * @param other
     * @param bidirectional
     */
    connectTo<N extends IGraphNode>(other: N, bidirectional?: boolean): IGraphNode {
        if (!(other instanceof Base)) throw new IncompatibleTargetError("Target should be a Base.");

        return super.connectTo(other, bidirectional);
    }
}

export interface IBase extends IGraphNode {

    readonly occupation: number;
    readonly capacity: number;

}
