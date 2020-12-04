import {D3DragEvent, drag, DragBehavior, DraggedElementBaseType, SubjectPosition} from "d3-drag";
import Node from "ts-shared/build/graph/Node";
import {BaseType, select, Selection} from "d3-selection";
import DirectedGraph from "ts-shared/build/graph/DirectedGraph";
import {Interval} from "ts-shared/build/geometry/Interval";
import {zoom, ZoomBehavior, ZoomedElementBaseType} from "d3-zoom";
import {ICoordinate} from "ts-shared/build/geometry/Coordinate";

/**
 * Defines useful helpers for shorthanding
 * boilerplate operations within the GameMap classes
 */
export abstract class GameMapHelpers {

    /** Generates a drag function for a given Node element, with default handlers pre-assigned
     * custom handlers can be passed to append behaviour to the end of the default handlers.
     * This is necessary to tie actions to react state. */
    public static NodeDragBehavior<E extends DraggedElementBaseType, N extends Node>(
        onStart: (elem: E, evt: D3DragEvent<E, N, any>, dataPoint: N) => void,
        onDrag: (elem: E, evt: D3DragEvent<E, N, any>, dataPoint: N) => void,
        onEnd: (elem: E, evt: D3DragEvent<E, N, any>, dataPoint: N) => void,
        config: DragConfig = DragConfig.default
    ): DragBehavior<E, N, SubjectPosition | N> {

        const {step, snapRadius} = config;

        // sets node to active
        function defaultOnStart(this: E, evt: any, dataPoint: N) {
            select(this).classed("grabbed", true);
            onStart(this, evt, dataPoint);
        }

        // changes the element's location
        function defaultOnDrag(this: E, evt: any, dataPoint: N) {
            let {x, y} = evt;

            const snapCore = DirectedGraph.snapToGrid(x, y);
            const fractionOfStep = step * snapRadius;
            const snapZone = {
                x: new Interval(snapCore.x - fractionOfStep, snapCore.x + fractionOfStep),
                y: new Interval(snapCore.y - fractionOfStep, snapCore.y + fractionOfStep)
            };

            x = snapZone.x.contains(x) ? snapCore.x : x;
            y = snapZone.y.contains(y) ? snapCore.y : y;

            select(this)
                .selectAll("circle")
                .attr("cx", x)
                .attr("cy", y);

            select(this)
                .selectAll("text")
                .attr("x", x + dataPoint.radius + 1)
                .attr("y", y);

            onDrag(this, evt, dataPoint);

        }

        // deactivates node, updates real value
        function defaultOnEnd(this: E, evt: any, coordinate: N) {
            const {x, y} = DirectedGraph.snapToGrid(evt.x, evt.y)

            select(this).classed("grabbed", false);
            coordinate.moveTo(x, y);

            onEnd(this, evt, coordinate);

        }

        return drag<E, N>()
            .on("start", defaultOnStart)
            .on("drag", defaultOnDrag)
            .on("end", defaultOnEnd);

    }

    /** initializes zoom function
     * @param {Object} extent object that defines topL and bottomL `Coordinate`s for the size of the zoom
     * @param {number} buffer Buffer to the translation extent
     * @param {Selection} selection D3 selection to which the transformations of the zoom element should be applied to */
    public static GraphZoomBehavior<E extends ZoomedElementBaseType, Data, ElementToTransform extends BaseType>(
        extent: {
            topL: ICoordinate,
            bottomR: ICoordinate
        },
        selection: Selection<ElementToTransform, Data, null, undefined>,
        buffer: number = 25
    ): ZoomBehavior<E, Data> {

        return zoom<E, Data>()
            .scaleExtent([0.5, 2])
            .translateExtent([
                [extent.topL.x - buffer, extent.topL.y - buffer],
                [extent.bottomR.x + buffer, extent.bottomR.y + buffer]
            ])
            .on("zoom", (event: any, d: Data) => selection.attr("transform", event.transform.toString()));

    }


}

export class DragConfig {
    public readonly step: number;
    public readonly snapRadius: number;

    static readonly default: DragConfig = new DragConfig(1, 0.05);

    constructor(step: number, snapRadius: number) {
        this.step = step;
        this.snapRadius = snapRadius;
    }

}
