import {DraggableUnit} from "./Draggable";
import {ScalableUnit} from "./Scalable";
import {DepictableUnit} from "./UnitInterfaces";
import {ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {AnySelection} from "../../util/DrawHelpers";
import {Base} from "ts-shared/build/mechanics/Base";
import {GenericConstructor} from "ts-shared/build/util/MixinUtil";
import {TAction, TargetAction} from "../../util/Action";
import {SampleShapes} from "../shape/Premade";
import {IGraphNode} from "ts-shared/build/graph/GraphInterfaces";

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



            },
            {
                start: b => {},
                stop: b => {}
            }
        );
    }

}
