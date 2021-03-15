import {DraggableUnit} from "./Draggable";
import {ScalableUnit} from "./Scalable";
import {DepictableUnit} from "./UnitInterfaces";
import {C, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {AnySelection, defaultDepictions} from "../../util/DrawHelpers";
import {Base} from "ts-shared/build/mechanics/Base";
import {CompositeShape} from "../shape/CompositeShape";
import {GenericConstructor} from "ts-shared/build/util/MixinUtil";
import {CircleShape} from "../shape/CircleShape";
import {LineShape} from "../shape/LineShape";
import {AbstractShape} from "../shape/ShapeUtil";
import Rectangle from "ts-shared/build/geometry/Rectangle";
import {RectangleShape} from "../shape/RectangleShape";

const primitives = {
    tower: defaultDepictions.grays.light.setStrokeWidth(0.5).setHoverable(true),
    connector: defaultDepictions.noFill.grays.medium.setStrokeWidth(1.8)
}

const tower = new CircleShape(1.6, C(-4, -4), primitives.tower);
const towers = [
    tower,
    tower.duplicate().translateBy(8, 0),
    tower.duplicate().translateBy(8, 8),
    tower.duplicate().translateBy(0, 8)
];
const outerConnector = new LineShape([...towers.map(_ => _.center), tower.center]);
const background = new RectangleShape(Rectangle.fromCorners(tower.center, towers[2].center));

const baseDepiction = new CompositeShape("base", [background, outerConnector, ...towers] as AbstractShape[]);

export default class BaseUnit
    extends DraggableUnit(ScalableUnit(DepictableUnit<SVGGElement, GenericConstructor<Base>>(Base, baseDepiction))) {

    // declare constructor so the code-analysis doesn't freak out
    constructor(id: string, position?: ICoordinate, name?: string) {
        super(id, position, name);
    }

    attachDepictionTo(d3selection: AnySelection) {

        super.attachDepictionTo(d3selection);
        this.initializeDrag();

    }

}
