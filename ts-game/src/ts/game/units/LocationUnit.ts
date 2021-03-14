import {DepictableUnit} from "./UnitInterfaces";
import LocationNode from "ts-shared/build/graph/LocationNode";
import {CompositeShape} from "../shape/ShapeUtil";
import {CircleShape} from "../shape/CircleShape";
import {ScalableUnit} from "./Scalable";
import {DraggableUnit} from "./Draggable";
import {ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {AnySelection} from "../../util/DrawHelpers";

// TODO: REMOVE
// @ts-ignore
const debugDepic = new CompositeShape("sprite", [new CircleShape(this, 5)]);

export class DepictableLocationNode extends DepictableUnit(LocationNode, debugDepic) {}

export class ScalableLocationNode extends ScalableUnit(DepictableLocationNode) {}

export class DraggableLocationNode extends DraggableUnit(ScalableLocationNode) {

    constructor(id: string, position?: ICoordinate, name?: string) {
        super(id, position, name);
    }

    attachDepictionTo(d3selection: AnySelection) {
        super.attachDepictionTo(d3selection);

        this.initializeDrag();
    }

}



