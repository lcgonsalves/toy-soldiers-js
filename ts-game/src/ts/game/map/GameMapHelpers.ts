import {D3DragEvent, DraggedElementBaseType} from "d3-drag";
import Node from "ts-shared/build/graph/Node";
import {BaseType, Selection} from "d3-selection";
import {zoom, ZoomBehavior, ZoomedElementBaseType} from "d3-zoom";
import {Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import DirectedGraph from "ts-shared/build/graph/DirectedGraph";
import {Interval} from "ts-shared/build/geometry/Interval";

// shorthand types
export type NodeDragHandler<E extends DraggedElementBaseType, N extends Node> = (elem: E, evt: D3DragEvent<E, N, any>, dataPoint: N) => void

/**
 * Defines useful helpers for shorthanding
 * boilerplate operations within the GameMap classes
 */
export abstract class GameMapHelpers {

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

    /**
     * Given a coordinate and a map configuration
     * @param coordinate
     * @param config
     */
    public static snapIfWithinRadius = (coordinate: ICoordinate, config: GameMapConfig): ICoordinate => {
        let {x,y} = coordinate;
        const {step, snapRadius} = config;
        const snapCore = GameMapHelpers.snap(coordinate);
        const fractionOfStep = step * snapRadius;
        const snapZone = {
            x: new Interval(snapCore.x - fractionOfStep, snapCore.x + fractionOfStep),
            y: new Interval(snapCore.y - fractionOfStep, snapCore.y + fractionOfStep)
        };

        x = snapZone.x.contains(x) ? snapCore.x : x;
        y = snapZone.y.contains(y) ? snapCore.y : y;
        return new Coordinate(x,y);
    }

    public static snap = (coordinate: ICoordinate): ICoordinate => DirectedGraph.snapCoordinateToGrid(coordinate)


}

export class GameMapConfig {
    public readonly step: number;
    public readonly snapRadius: number;
    public readonly snapWhileDragging: boolean;
    public readonly snapOnEnd: boolean;

    static readonly default: GameMapConfig = new GameMapConfig();

    constructor(step: number = 1, snapRadius: number = 0.05, snapWhileDragging: boolean = false, snapOnEnd: boolean = true) {
        this.snapWhileDragging = snapWhileDragging;
        this.snapOnEnd = snapOnEnd;
        this.step = step;
        this.snapRadius = snapRadius;
    }

}
