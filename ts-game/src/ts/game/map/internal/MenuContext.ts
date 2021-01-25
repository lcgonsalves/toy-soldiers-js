import {IGraphNode} from "ts-shared/build/lib/graph/GraphInterfaces";
import {ICoordinate} from "ts-shared/build/lib/geometry/Coordinate";
import {LocationContext} from "ts-shared/build/lib/mechanics/Location";
import LocationUnit from "../../units/LocationUnit";
import {RectConfig} from "../../../util/DrawHelpers";
import Rectangle from "ts-shared/build/lib/geometry/Rectangle";

export default class MenuContext extends LocationContext<LocationUnit> {

    /** maps a node id to the location of its containing box */
    public readonly boxLocations: Map<string, ICoordinate> = new Map<string, ICoordinate>();
    public readonly config: {
        mainContainer: RectConfig
    };
    public onNodeRemoval: (node: LocationUnit) => void = () => {};

    constructor(mainContainerConfig: RectConfig) {
        super();

        this.config = {
            mainContainer: mainContainerConfig
        };
    }

    // TODO: make sure that on drag we receive the associated datum
    snap(node: LocationUnit): ICoordinate {

        const closestBox = this.boxLocations.get(node.id);
        const menuBounds = this.config.mainContainer.bounds;

        console.log("menu bounds", menuBounds);
        console.log("node location", node.toString(), node.worldContext);
        console.log(menuBounds.overlaps(node));

        if (closestBox && menuBounds.overlaps(node))
            return node.translateToCoord(closestBox);
        else {
            this.rm(node.id);
            this.onNodeRemoval(node);
            return node;
        };
        // else connect to node context and apply the transform

    }

    add(...n: LocationUnit[]): MenuContext {
        super.add(...n);
        n.forEach(_ => this.boxLocations.set(_.id, _.copy));
        return this;
    }

}
