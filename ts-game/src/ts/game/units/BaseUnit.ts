import {DraggableUnit} from "./Draggable";
import {ScalableUnit} from "./Scalable";
import {DepictableUnit} from "./UnitInterfaces";
import {ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {AnySelection} from "../../util/DrawHelpers";
import {Base, BaseContext} from "ts-shared/build/mechanics/Base";
import {GenericConstructor} from "ts-shared/build/util/MixinUtil";
import {TAction, TargetAction} from "../../util/Action";
import {SampleShapes} from "../shape/Premade";
import {IGraphNode} from "ts-shared/build/graph/GraphInterfaces";
import {Selection} from "d3-selection";
import LocationUnit from "./LocationUnit";
import {Set} from "typescript-collections";
import EMap from "ts-shared/build/util/EMap";
import {LocationContext} from "ts-shared/build/mechanics/Location";
import {ActionTooltip} from "../map/internal/Tooltip";

/** #################################### *
 *        Construct Depictable Base      *
 *  #################################### */

export interface UnitInteraction<Unit> {
    /** The base where the hover event was triggered */
    target: Unit,

    /** The specific coordinate where the hover event happened. Use this to focus the tooltip on specific elements of the sprite. */
    focus: ICoordinate
}

export interface Road<F extends ICoordinate, T extends ICoordinate> {
    from: F,
    to: T,
    intermediates: ICoordinate[]
}

export default class BaseUnit
    extends DraggableUnit(ScalableUnit(DepictableUnit<SVGGElement, GenericConstructor<Base>>(Base, SampleShapes.base)))
        implements IGraphNode {

    // maps id of
    roads: EMap<string, Road<ICoordinate, any>> = new EMap<string, Road<ICoordinate, any>>();
    roadAnchor: Selection<SVGGElement, [ICoordinate, ICoordinate], any, any> | undefined;

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
        backgroundContext: SVGGElement,
        tooltip: ActionTooltip,
        locations: LocationContext<LocationUnit>,
        bases: BaseContext<BaseUnit, LocationUnit>
    ): TargetAction<BaseUnit>[] {

        const a = [];

        // if we have at least 1 connector availabe, we can have the connect action
        if (this.adjacent.length < this.roadConnectors)
            a.push(this.buildRoadAction(backgroundContext, locations.nodes.values, bases.nodes.values));

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
     */
    buildRoadAction(
        backgroundContext: SVGGElement,
        getAvailableLocations: () => LocationUnit[],
        getAvailableNeighboringBases: () => BaseUnit[]
    ): TargetAction<BaseUnit> {
        return TAction("connect", "Build Road", TargetAction.depiction.neutral, (base) => {

            // lock everything in place
            const basesAndLoc = [...getAvailableNeighboringBases(), ...getAvailableLocations()];

            // set will compare by string, which in this case is the position. Hence if I add the Bases first,
            // and Locations second, we will yield the Bases + Unoccupied locations.
            const validPlacements = new Set<BaseUnit | LocationUnit>(item => item.simple.toString());

            basesAndLoc.forEach(_ => {
                // get filter for bases that have at least 1 available connector
                if (_ instanceof Base && (_.adjacent.length < _.roadConnectors)) {
                    validPlacements.add(_);
                } else if (_ instanceof LocationUnit) {
                    // the else if here prevents us from adding if the connector > adjacent check returns false
                    validPlacements.add(_)
                }

                _.disableDrag();
            });

            // hook observers on the valid placements. Listen for clicks!
            validPlacements.forEach(trgt => {
                trgt.onClick((evt: UnitInteraction<BaseUnit | LocationUnit>) => console.log(evt.focus, evt.target))


            });

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

}
