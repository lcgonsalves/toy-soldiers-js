import {DraggableUnit} from "./Draggable";
import {ScalableUnit} from "./Scalable";
import {DepictableUnit} from "./UnitInterfaces";
import {C, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {AnySelection, defaultDepictions, followMouseIn} from "../../util/DrawHelpers";
import {Base} from "ts-shared/build/mechanics/Base";
import {CompositeShape} from "../shape/CompositeShape";
import {GenericConstructor} from "ts-shared/build/util/MixinUtil";
import {CircleShape} from "../shape/CircleShape";
import {LineShape} from "../shape/LineShape";
import {AbstractShape} from "../shape/ShapeUtil";
import Rectangle from "ts-shared/build/geometry/Rectangle";
import {RectangleShape} from "../shape/RectangleShape";
import {IClickable, IHoverable} from "ts-shared/build/reactivity/IReactive";
import {Subject, Subscription} from "rxjs";
import {TAction, TargetAction} from "../../util/Action";
import LocationNode from "ts-shared/build/graph/LocationNode";
import LocationUnit from "./LocationUnit";
import {IGraphNode} from "ts-shared/build/graph/GraphInterfaces";
import {DestinationInvalidError} from "../../util/Errors";


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

    readonly $click: Subject<BaseUnit> = new Subject();
    readonly $mouseEnter: Subject<BaseUnitHoverEvent> = new Subject();
    readonly $mouseLeave: Subject<BaseUnitHoverEvent> = new Subject();

    onClick(observer: (evt: BaseUnit) => void): Subscription {
        return this.$click.subscribe(observer);
    }

    onMouseEnter(observer: (evt: BaseUnitHoverEvent) => void): Subscription {
        return this.$mouseEnter.subscribe(observer);
    }

    onMouseLeave(observer: (evt: BaseUnitHoverEvent) => void): Subscription {
        return this.$mouseLeave.subscribe(observer);
    }

    /** #################################### *
     *            Base Target Actions        *
     *  #################################### */

    /**
     *  Routine for connecting a road between two bases, or between a base and a location.
     *
     *  @param backgroundContext SVG element that contains the background
     *  @param pre any preprocessing needed to be done before initiating a connection sequence, such as disabling tooltip, freezing nodes in place, etc.
     *  @param post any postprocessing needed to be done after a connection sequence finishes, either cancelled, failed, or successful, such as re-enabling tooltip, re-enabling drag on nodes, etc.
     */
    buildRoad(
        backgroundContext: SVGGElement
    ): TargetAction<BaseUnit> {
        return TAction(
            "build_road",
            "Build Road",
            (base) => {

                // instantiate a location node, connect to it. track its movement with an observable.
                const mouseTrackingNode = new LocationUnit("mtn", this, "Mouse Tracking Node");
                base.connectTo(mouseTrackingNode);

                // neighbors that can be connected to, sorted by distance to base
                const availableNeighbors = this.worldContext.nodes
                    .filter((_, node: Base) => node.occupation < node.capacity)
                    .sort((a, b) => {
                        const [_, baseA] = a;
                        const [__, baseB] = b;

                        return baseA.distance(base) - baseB.distance(base);

                    });

                // for all other bases & locations in the context, we stop them from being dragged, and attach listeners for clicks
                this.worldContext.availableLocations.forEach(l => {

                });


                // make them listen to clicks now


                const $mouseTracker = followMouseIn(backgroundContext, mousePos => {
                });



            },
            {
                start: b => {},
                stop: b => {}
            }
        );
    }

    // performs cleanup, and disconnects from all adjacent nodes, deletes depiction and roads.
    delete(): void {

        // clear subscriptions
        this.$click.complete();
        this.$mouseLeave.complete();
        this.$mouseEnter.complete();


    }

}
