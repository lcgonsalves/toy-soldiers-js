import {DepictableUnit, Sprite} from "./mixins/Depictable";
import LocationNode from "ts-shared/build/graph/LocationNode";
import {ScalableUnit} from "./mixins/Scalable";
import {DraggableUnit} from "./mixins/Draggable";
import {ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {AnySelection, defaultDepictions} from "../../util/DrawHelpers";
import {SampleShapes} from "../shape/Premade";
import {GenericConstructor} from "ts-shared/build/util/MixinUtil";
import {CompositeShape} from "../shape/CompositeShape";
import {CircleShape} from "../shape/CircleShape";

export const LocationUnitDepiction: Sprite =
    new CompositeShape("location_unit").addCircle(1.5, x=>x, defaultDepictions.grays.medium.setClickable(true));

/** #################################### *
 *      Construct Depictable Location    *
 *  #################################### */

/**
 *  Represent a valid location, where other units can be placed.
 */
export default class LocationUnit
    extends DraggableUnit(ScalableUnit(DepictableUnit<SVGGElement, GenericConstructor<LocationNode>>(LocationNode, LocationUnitDepiction))) {

    // declare constructor so the code-analysis doesn't freak out
    constructor(id: string, position?: ICoordinate, name?: string) {
        super(id, position, name);
    }

    // tie initialize drag into attachment of depiction.
    attachDepictionTo(d3selection: AnySelection) {
        super.attachDepictionTo(d3selection);
        this.initializeDrag();
    }

}
