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
import {IClickable, IHoverable} from "ts-shared/build/reactivity/IReactive";
import {Observable, Subject, Subscription} from "rxjs";


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
const outerConnector = new LineShape([...towers.map(_ => _.center), tower.center]);
const background = new RectangleShape(Rectangle.fromCorners(tower.center, towers[2].center), defaultDepictions.grays.dark.setOpacity(0.45));

const baseDepiction = new CompositeShape("base", [background, outerConnector, ...towers] as AbstractShape[]);

/** #################################### *
 *        Construct Depictable Base      *
 *  #################################### */

export interface BaseUnitHoverEvent {
    /** The base where the hover event was triggered */
    base: BaseUnit,

    /** The specific coordinate where the hover event happened. Use this to focus the tooltip on specific elements of the sprite. */
    focus: ICoordinate
}

export default class BaseUnit
    extends DraggableUnit(ScalableUnit(DepictableUnit<SVGGElement, GenericConstructor<Base>>(Base, baseDepiction)))
    implements IClickable<BaseUnit>, IHoverable<BaseUnitHoverEvent> {

    // declare constructor so the code-analysis doesn't freak out
    constructor(id: string, position?: ICoordinate, name?: string) {
        super(id, position, name);
    }

    attachDepictionTo(d3selection: AnySelection) {

        super.attachDepictionTo(d3selection);
        this.initializeDrag();

        /* TODO:
               - properly emit hover events
               - block click events when drag is enabled
               - hook these observables to tooltip
                    - when hovering in center, focus on center
                    - when hovering on a tower, focus on tower

         */

    }

    readonly $click: Observable<BaseUnit> = new Subject();
    readonly $mouseEnter: Observable<BaseUnitHoverEvent> = new Subject();
    readonly $mouseLeave: Observable<BaseUnitHoverEvent> = new Subject();

    onClick(observer: (evt: BaseUnit) => void): Subscription {
        return this.$click.subscribe(observer);
    }

    onMouseEnter(observer: (evt: BaseUnitHoverEvent) => void): Subscription {
        return this.$mouseEnter.subscribe(observer);
    }

    onMouseLeave(observer: (evt: BaseUnitHoverEvent) => void): Subscription {
        return this.$mouseLeave.subscribe(observer);
    }



}
