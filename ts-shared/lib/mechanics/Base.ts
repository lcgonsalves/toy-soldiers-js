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

    get worldContext(): BaseContext<Base> { return super.worldContext as BaseContext<Base> }

    get occupation(): number {
        return this._occupation;
    }

    /** returns all of the (this.adjacent) that are specifically LocationNodes */
    get adjacentLocations(): LocationNode[] {
        return this.adjacent.filter(_ => _.key === LocationNode.key);
    }

    /** returns all of the (this.adjacent) that are specifically Bases */
    get adjacentBases(): Base[] {
        // type case enforced by key definition
        return this.adjacent.filter(_ => _.key === Base.key) as Base[];
    }

    get adjacent(): (Base | LocationNode)[] {
        // type cast enforced by this.connectTo() function
        return super.adjacent as (Base | LocationNode)[];
    }

    /**
     * Connects this base to another Base, if a connection is available.
     * @param other
     * @param bidirectional
     */
    connectTo(other: IGraphNode, bidirectional?: boolean): this {
        super.connectTo(other, bidirectional);
        return this;
    }

    disconnectFrom(other: IGraphNode, bidirectional?: boolean): this {
        super.disconnectFrom(other, bidirectional);
        return this;
    }

    associate(worldContext: BaseContext<Base>): this {
        return super.associate(worldContext);
    }

}


export class BaseContext<B extends Base, L extends LocationNode = LocationNode> extends LocationContext<B> {

    readonly locations: LocationContext<L>;

    get availableLocations(): LocationNode[] {

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
