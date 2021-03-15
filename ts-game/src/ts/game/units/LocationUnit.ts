import {DepictableUnit} from "./UnitInterfaces";
import LocationNode from "ts-shared/build/graph/LocationNode";
import {ScalableUnit} from "./Scalable";
import {DraggableUnit} from "./Draggable";
import {ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {AnySelection} from "../../util/DrawHelpers";
import {SampleShapes} from "../shape/Premade";


/** #################################### *
 *      Construct Depictable Location    *
 *  #################################### */

/**
 *  Represent a valid location, where other units can be placed.
 */
export default class LocationUnit
    extends DraggableUnit(ScalableUnit(DepictableUnit<SVGCircleElement>(LocationNode, SampleShapes.dot))) {

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
