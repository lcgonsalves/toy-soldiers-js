import {DraggableUnit} from "./Draggable";
import {ScalableUnit} from "./Scalable";
import {DepictableUnit} from "./UnitInterfaces";
import {SampleShapes} from "../shape/CompositeShape";
import {ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {AnySelection} from "../../util/DrawHelpers";
import {Base} from "ts-shared/build/mechanics/Base";

export default class BaseUnit
    extends DraggableUnit(ScalableUnit(DepictableUnit<SVGGElement>(Base, SampleShapes.base))) {

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