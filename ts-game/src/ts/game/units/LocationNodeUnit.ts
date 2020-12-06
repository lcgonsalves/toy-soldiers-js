import Node from "ts-shared/build/graph/Node";
import {EnterElement, Selection, select} from "d3-selection";
import AbstractNodeUnit from "./AbstractNodeUnit";
import {SVGAttrs, SVGTags} from "../../util/SVGHelper";
import {GameMapConfig, GameMapHelpers} from "../map/GameMapHelpers";
import {Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import DirectedGraph from "ts-shared/build/graph/DirectedGraph";
import {Interval} from "ts-shared/build/geometry/Interval";

class LocationNodeUnit<AssociatedNode extends Node = Node> extends AbstractNodeUnit<AssociatedNode> {


    constructor(
        node: AssociatedNode,
        anchor: Selection<any, AssociatedNode, any, any>,
        draggable: boolean = false,
        dragConfig: GameMapConfig | undefined = draggable ? GameMapConfig.default : undefined
    ) {
        super(node, anchor, draggable, dragConfig);

    }

    protected renderDepiction(enterSelection?: Selection<EnterElement, AssociatedNode, any, any>) {
        const s = enterSelection ? enterSelection : this.anchor.enter();

        s.append(SVGTags.SVGCircleElement)
            .classed(css.NodeCircle, true)
            .attr(SVGAttrs.cx, node => node.x)
            .attr(SVGAttrs.cy, node => node.y)
            .attr(SVGAttrs.r, node => node.radius);

        s.append(SVGTags.SVGTextElement)
            .classed(css.NodeLabel, true)
            .attr(SVGAttrs.x, node => node.x + node.radius + 1)
            .attr(SVGAttrs.y, node => node.y)
            .text(node => node.id);
    }

    protected removeDepiction(exitSelection: Selection<SVGGElement, AssociatedNode, SVGElement, any> | undefined): void {
    }

    protected updateDepiction(joinedSelection: Selection<SVGGElement, AssociatedNode, SVGElement, any> | undefined): void {
    }

    defaultOnDragGrabbedragGrabbed<E extends SVGGElement>(): (this: SVGGElement, evt: any, n: AssociatedNode) => void {
        // use this space to access "this" method -- thanks d3
        const config = this.dragConfig ? this.dragConfig : GameMapConfig.default;

        return function (this: SVGGElement, evt: any, n: AssociatedNode) {
            let {x, y} = evt;
            const coord = new Coordinate(x, y);

             if (config.snapWhileDragging) coord.moveToCoord(GameMapHelpers.snapIfWithinRadius(coord, config));

            select(this)
                .selectAll("circle")
                .attr("cx", x)
                .attr("cy", y);

            select(this)
                .selectAll("text")
                .attr("x", x + n.radius + 1)
                .attr("y", y);

        }
    }

    }

    const enum css {
    NodeCircle = "node_circle",
    NodeLabel = "node_label"
}
