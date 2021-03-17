import LocationNode from "../graph/LocationNode";
import {IGraphNode} from "../graph/GraphInterfaces";
import {LocationContext} from "./Location";
import {ICoordinate} from "../geometry/Coordinate";

/**
 * Describes a location in which Pawns may be located at.
 * These define internal rules such as how many pawns may stay in them, if more pawns are generated at every turn, if it can be attacked,
 * and other stats.
 */
export class Base extends LocationNode implements IBase {

    readonly key: string = Base.key;
    static readonly key: string = "base";

    private _occupation: number = 0;
    readonly capacity: number = 10;

    readonly roadConnectors: number = 4;

    get occupation(): number {
        return this._occupation;
    }

    /** returns all of the (this.adjacent) that are specifically LocationNodes */
    get adjacentLocations(): LocationNode[] {
        return this.adjacent.filter(_ => (_ instanceof LocationNode) && !(_ instanceof Base)) as unknown as LocationNode[];
    }

    /** returns all of the (this.adjacent) that are specifically Bases */
    get adjacentBases(): Base[] {
        return this.adjacent.filter(_ => _ instanceof Base) as unknown as Base[];
    }

}


export class BaseContext<B extends Base, L extends LocationNode> extends LocationContext<B> {

    readonly locations: LocationContext<L>;

    get availableLocations(): L[] {

        // get all positions, sorted by distance
        const allLocations = this.locations.all();
        const allBases = this.all();

        function doesntOverlap(c: ICoordinate): boolean {
            return !allBases.find(b => b.overlaps(c))
        }

        return allLocations.filter(doesntOverlap);

    }

    constructor(availableLocations: LocationContext<L>) {
        super(availableLocations.domain.x.step, availableLocations.width, availableLocations.height);

        this.locations = availableLocations;
    }

    /** Bases can only exist on top of valid locations; snap() will translate the existing coordinate
     * to the coordinate of the nearest location that doesn't overlap with any of the bases in this context. */
    snap(coordinate: ICoordinate): ICoordinate {

        // get first after sorting by distance
        const valid = this.availableLocations.sort(((a, b) => coordinate.distance(a) - coordinate.distance(b)))[0];

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
