import {CircleShape} from "./CircleShape";
import {C, Coordinate} from "ts-shared/build/geometry/Coordinate";
import {defaultDepictions} from "../../util/DrawHelpers";
import {RectangleShape} from "./RectangleShape";
import Rectangle from "ts-shared/build/geometry/Rectangle";
import {CompositeShape} from "./CompositeShape";
import {AbstractShape} from "./ShapeUtil";


/** #################################### *
 *       Initialize Unit Depiction       *
 *  #################################### */

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
const background = new RectangleShape(Rectangle.fromCorners(tower.center, towers[2].center), defaultDepictions.grays.dark.setOpacity(0.45).setHoverable(true));
const borders = new RectangleShape(Rectangle.fromCorners(tower.center, towers[2].center), defaultDepictions.noFill.grays.dark)

const baseDepiction = new CompositeShape("base", [background, borders, ...towers] as AbstractShape[]);

export const SampleShapes = {
    dot: new CircleShape(1.3, Coordinate.origin, defaultDepictions.grays.medium.setHoverable(true)),
    base: baseDepiction
}
