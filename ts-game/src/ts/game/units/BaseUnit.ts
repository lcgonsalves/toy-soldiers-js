import {DraggableUnit} from "./Draggable";
import {ScalableUnit} from "./Scalable";
import {DepictableUnit} from "./UnitInterfaces";
import {C, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {AnySelection, defaultDepictions} from "../../util/DrawHelpers";
import {Base} from "ts-shared/build/mechanics/Base";
import {CompositeShape} from "../shape/CompositeShape";

const primitives = {
    tower: defaultDepictions.grays.light.setStrokeWidth(0.5).setHoverable(true),
    connector: defaultDepictions.noFill.grays.medium.setStrokeWidth(1.8)
}

const baseDepiction = new CompositeShape("base")
    .addLine([C(0, -4), C(0, 4)], primitives.connector)
    .addLine([C(-4, 0), C(4, 0)], primitives.connector)
    .addCircle(1.6, c => c.translateBy(0, -4), primitives.tower)
    .addCircle(1.6, c => c.translateBy(-4, 0), primitives.tower)
    .addCircle(1.6, c => c.translateBy(4, 0), primitives.tower)
    .addCircle(1.6, c => c.translateBy(0, 4), primitives.tower);


export default class BaseUnit
    extends DraggableUnit(ScalableUnit(DepictableUnit<SVGGElement>(Base, baseDepiction))) {

    // declare constructor so the code-analysis doesn't freak out
    constructor(id: string, position?: ICoordinate, name?: string) {
        super(id, position, name);

    }

    attachDepictionTo(d3selection: AnySelection) {

        super.attachDepictionTo(d3selection);
        this.initializeDrag();

    }

}
