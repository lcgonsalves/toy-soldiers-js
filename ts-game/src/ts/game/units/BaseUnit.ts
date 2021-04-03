import {DraggableUnit} from "./mixins/Draggable";
import {ScalableUnit} from "./mixins/Scalable";
import {DepictableUnit} from "./mixins/Depictable";
import {C, closest, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {AnySelection, defaultDepictions} from "../../util/DrawHelpers";
import {Base, BaseContext} from "ts-shared/build/mechanics/Base";
import {GenericConstructor} from "ts-shared/build/util/MixinUtil";
import {TAction, TargetAction} from "../../util/Action";
import {baseUnitDepictionPrimitives, SampleShapes} from "../shape/Premade";
import {IGraphNode} from "ts-shared/build/graph/GraphInterfaces";
import LocationUnit from "./LocationUnit";
import {Set} from "typescript-collections";
import {LocationContext} from "ts-shared/build/mechanics/Location";
import {ActionTooltip} from "../map/internal/Tooltip";
import {CircleShape} from "../shape/CircleShape";
import {fromEvent} from "rxjs";
import {Events} from "../../util/Events";
import {pointer} from "d3-selection";
import {RoadUnit} from "./RoadUnit";
import LocationNode from "ts-shared/build/graph/LocationNode";
import {ISocket} from "../../util/Socket";

/** #################################### *
 *        Construct Depictable Base      *
 *  #################################### */

export interface UnitInteraction<Unit> {
    /** The base where the hover event was triggered */
    target: Unit,

    /** The specific coordinate where the hover event happened. Use this to focus the tooltip on specific elements of the sprite. */
    focus: ICoordinate
}

export default class BaseUnit
    extends DraggableUnit(ScalableUnit(DepictableUnit<SVGGElement, GenericConstructor<Base>>(Base, SampleShapes.base)))
        implements IGraphNode {

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

    /** #################################### *
     *            Base Target Actions        *
     *  #################################### */

    getActions(
        backgroundContext: AnySelection,
        tooltip: ActionTooltip,
        locations: LocationContext<LocationUnit>,
        bases: BaseContext<BaseUnit, LocationUnit>,
        focus: ICoordinate,
        addRoad: (from: IGraphNode, to: IGraphNode, toSocket?: ICoordinate) => void
    ): TargetAction<BaseUnit>[] {

        const a = [];

        // if we have at least 1 connector availabe, we can have the connect action
        if (this.adjacent.length < this.roadConnectors)
            a.push(
                this.buildRoadAction(
                    backgroundContext,
                    () => locations.nodes.values(),
                    () =>  bases.nodes.values(),
                    focus,
                    addRoad
                )
            );

        // add delete action at the end
        a.push(this.deleteBaseAction(bases, tooltip));

        return a;

    }

    /**
     *  Routine for connecting a road between two bases, or between a base and a location.
     *
     *  @param backgroundContext SVG element that contains the background
     *  @param getAvailableLocations getter for fetching locations in context
     *  @param getAvailableNeighboringBases getter for fetching bases in ctx
     *  @param focus the precise point in the depiction that the road should be built from.
     *  @param addRoad function to add road – controller should handle this
     */
    buildRoadAction(
        backgroundContext: AnySelection,
        getAvailableLocations: () => LocationUnit[],
        getAvailableNeighboringBases: () => BaseUnit[],
        focus: ICoordinate,
        addRoad: (from: IGraphNode, to: IGraphNode, toSocket?: ICoordinate) => void
    ): TargetAction<BaseUnit> {
        return TAction("connect", "Build Road", TargetAction.depiction.neutral, (base) => {

            // sort by distance to base to improve some of the performance
            const basesAndLoc = [...getAvailableNeighboringBases(), ...getAvailableLocations()]
                .sort((a, b) => a.distance(base) - b.distance(base));

            // set will compare by string, which in this case is the position. Hence if I add the Bases first,
            // and Locations second, we will yield the Bases + Unoccupied locations.
            const validPlacements = new Set<BaseUnit | LocationUnit>(item => item.simple.toString());

            basesAndLoc.forEach(bOrLoc => {
                bOrLoc.disableDrag();

                if (bOrLoc.equals(base) || bOrLoc.overlaps(base)) return;

                // get filter for bases that have at least 1 available connector
                if (bOrLoc instanceof Base && (bOrLoc.adjacent.length < bOrLoc.roadConnectors)) {
                    validPlacements.add(bOrLoc);
                } else if (bOrLoc instanceof LocationUnit) {
                    // the else if here prevents us from adding if the connector > adjacent check returns false
                    validPlacements.add(bOrLoc)
                }

            });


            // hook observers on the valid placements. Listen for clicks!
            const subscriptions = validPlacements.toArray().map((trgt) => {
                return trgt.onClick((evt: UnitInteraction<BaseUnit | LocationUnit>) => {

                    // connect the base to the focus point of the interaction.
                    if (evt.target instanceof BaseUnit) base.connectTo(evt.target, true);

                    /* We build a road to wherever the user clicked. If the click is a base, we treat the base as adjacent.
                    * If the click is a location, we simply build a road towards it.
                    *
                    * TODO: if the location can access any other bases (not this) we can connect to those too since they're accessible from this base
                    * TODO: if a base is built on top of a location that has roads, we re-route all existing roads onto a single connector, and update connections
                    *  */

                    addRoad(base, evt.target, evt.focus);
                    cleanup();

                });
            });

            // now we instantiate a fake invisible node that will be deleted upon completion. It is a placeholder
            // so the user can see the road.
            // FIXME: absolutely outrageous disastrous software engineering. billion% spaghet
            const dep = new CircleShape(1, focus, defaultDepictions.noFill.grays.dark);
            const tracker = new LocationNode("temp", dep, "temporary");
            const rd = new RoadUnit(focus, tracker, focus, tracker, false);

            // fuck, disgusting 🍝
            const follower = dep.follow(tracker);

            dep.attachDepictionTo(this.anchor ?? backgroundContext);
            rd.attachDepictionTo(this.anchor ?? backgroundContext);

            backgroundContext.on(Events.mousemove, function (evt: any) {

                const [ptrX, ptrY] = pointer(evt);

                // when following, if we find a nearby base or location.
                // if the depiction's center is closer than a defined threshold we snap to that.
                const threshold = 10;
                const closestBase = validPlacements.toArray().find(x => x.distance(C(ptrX, ptrY)) <= threshold);
                const closestSocket = closestBase ? closest(C(ptrX, ptrY), closestBase.sockets) : undefined;

                /* When the mouse approaches a node, we will snap the tracker to the closest
                * socket of the closest node in the vicinity.
                * TODO: account for occipied nodes, snap to closest AVAILABLE node */
                closestBase && closestSocket ?
                    tracker.translateToCoord(closestSocket) :
                    tracker.translateTo(ptrX, ptrY);

            });


            const cleanup = () => {
                // re-enable drag for nodes and bases
                basesAndLoc.forEach(_ => _.enableDrag());

                // unsubscribe from click events
                subscriptions.forEach(_ => _.unsubscribe());

                // clean up tracker and event handler
                dep.delete();
                rd.delete();
                backgroundContext.on(Events.mousemove, null);
                follower.unsubscribe();

            }

        }, {
            start: b => {
            },
            stop: b => {
            }
        });
    }

    /**
     * Deletes base from context, and clears depiction and listeners.
     * @param context
     * @param tooltip
     */
    deleteBaseAction(
        context: BaseContext<BaseUnit, LocationUnit>,
        tooltip: ActionTooltip
    ): TargetAction<BaseUnit> {
        return TAction(
            "remove",
            "Delete Base",
            TargetAction.depiction.delete,
            (base) => {
                console.log(base)

                tooltip.unfocus();
                context.rm(base.id);
                base.delete();
            },
        );
    }


    protected getSockets(): ISocket[] {
        return this.sprite?.layers.filter(l => l.depiction.equals(baseUnitDepictionPrimitives.tower)) ?? [];
    }
}
