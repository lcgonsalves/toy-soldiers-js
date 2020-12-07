import Node from "ts-shared/build/graph/Node";
import {Selection} from "d3-selection";
import AbstractNodeUnit from "./AbstractNodeUnit";
import SVGAttrs from "../../util/SVGAttrs";
import SVGTags from "../../util/SVGTags";
import {GameMapConfig} from "../map/GameMapHelpers";

export default class LocationNodeUnit<AssociatedNode extends Node = Node> extends AbstractNodeUnit<AssociatedNode> {

    constructor(
        node: AssociatedNode,
        anchor: Selection<any, AssociatedNode, any, any>,
        draggable: boolean = false,
        dragConfig: GameMapConfig | undefined = draggable ? GameMapConfig.default : undefined
    ) {
        const tag = "location_node_unit";

        super(node, anchor, draggable, dragConfig, tag);

    }

    protected renderDepiction(): void {
        const s = this.current;

        s.append<SVGCircleElement>(SVGTags.SVGCircleElement)
            .attr(SVGAttrs.cx, node => node.x)
            .attr(SVGAttrs.cy, node => node.y)
            .attr(SVGAttrs.r, node => node.radius)
            .classed(css.NodeCircle, true);

        s.append<SVGTextElement>(SVGTags.SVGTextElement)
            .attr(SVGAttrs.x, node => node.x + node.radius + 1)
            .attr(SVGAttrs.y, node => node.y)
            .text(node => node.id)
            .classed(css.NodeLabel, true);
    }

    protected removeDepiction(): void {
        this.current.remove();
    }

    protected updateDepiction(): void {
        const s = this.current;

        s.select(SVGTags.SVGCircleElement)
            .attr(SVGAttrs.cx, node => node.x)
            .attr(SVGAttrs.cy, node => node.y)
            .attr(SVGAttrs.r, node => node.radius);

        s.select(SVGTags.SVGTextElement)
            .attr(SVGAttrs.x, node => node.x + node.radius + 1)
            .attr(SVGAttrs.y, node => node.y)
            .text(node => node.id);

    }

}

enum css {
    NodeCircle = "node_circle",
    NodeLabel = "node_label"
}
