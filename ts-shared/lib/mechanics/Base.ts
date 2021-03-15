import LocationNode from "../graph/LocationNode";
import {IGraphNode, IncompatibleTargetError} from "../graph/GraphInterfaces";
import {LocationContext} from "./Location";
import {ICoordinate} from "../geometry/Coordinate";


/**
 * Describes a location in which Pawns may be located at.
 * These define internal rules such as how many pawns may stay in them, if more pawns are generated at every turn, if it can be attacked,
 * and other stats.
 */
export class Base extends LocationNode implements IBase {

    readonly key: string = "base";

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

        this._occupation++;

        return super.connectTo(other, bidirectional);
    }

}


export class BaseContext<B extends Base> extends LocationContext<B> {

    readonly availableLocations: LocationContext<LocationNode>;

    constructor(availableLocations: LocationContext<LocationNode>) {
        super(availableLocations.domain.x.step, availableLocations.width, availableLocations.height);

        this.availableLocations = availableLocations;
    }

    /** Bases can only exist on top of valid locations; snap() will translate the existing coordinate
     * to the coordinate of the nearest location that doesn't overlap with any of the bases in this context. */
    snap(coordinate: ICoordinate): ICoordinate {

        // get all positions, sorted by distance
        const allLocations = this.availableLocations.all().sort(((a, b) => coordinate.distance(a) - coordinate.distance(b)));
        const allBases = this.all();

        function doesntOverlap(c: ICoordinate): boolean {
            return !allBases.find(b => b.overlaps(c))
        }

        const valid = allLocations.find(doesntOverlap);

        if (!valid) throw new Error("No available locations to snap to.");
        else {
            coordinate.translateToCoord(valid);
            return valid;
        }

    }
}

export interface IBase extends IGraphNode {

    readonly occupation: number;
    readonly capacity: number;

}
