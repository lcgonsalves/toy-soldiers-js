import {LocationContext} from "ts-shared/build/lib/mechanics/Location";
import {C, Coordinate} from "ts-shared/build/lib/geometry/Coordinate";
import {BaseType, select, Selection} from "d3-selection";
import SVGAttrs from "../../../util/SVGAttrs";
import SVGTags from "../../../util/SVGTags";
import {GameMapHelpers} from "../GameMapHelpers";
import {zoom} from "d3-zoom";
import {path, Path} from "d3-path";
import LocationUnit, {LocationUnitCSS} from "../../units/LocationUnit";
import {AnySelection, rect, RectConfig, TooltipConfig} from "../../../util/DrawHelpers";
import Rectangle from "ts-shared/build/lib/geometry/Rectangle";
import WorldContext from "ts-shared/build/lib/mechanics/WorldContext";
import {IGraphNode} from "ts-shared/build/lib/graph/GraphInterfaces";
import MenuContext from "./MenuContext";
import AbstractNode from "ts-shared/build/lib/graph/AbstractNode";
import LocationNode from "ts-shared/build/lib/graph/LocationNode";

const {GraphZoomBehavior} = GameMapHelpers;

interface MapEditorMapConfig {
    backgroundColor: string;
    foregroundColor: string;
    gridStroke: string;
    zoomBuffer: number;
}

enum mapEditorMapCSS {
    BG_ELEM_ID = "bg_elememnt",
    MAIN = "main_element",
    BOTTOM_MENU = "bottom_menu",
    TOOLTIP = "tooltip",
    GRID_ID = "grid_element",
    GRID_CLS = "grid",
    NODE_CONTAINER_ID = "nodes",
    NODE_CONTAINER_CLS = "node",
    POINTER_EVENTS = "none",
    EDGE_CONTAINER_ID = "edges",
    GAME_UNIT_BOX = "game_unit_box",
    TOOLTIP_ACTION_BUTTON = "tooltip_action_button"
}

/**
 * Basically tracks and renders contexts in the svg.
 */
export class MapEditorMap {
    // contexts
    public readonly nodeContext: LocationContext<LocationUnit>;

    // anchors
    private readonly edgeContainer: AnySelection;
    private readonly nodeContainer: AnySelection;
    private readonly mainGroup: AnySelection;

    private readonly zoomHandlers: Map<string, (scale: number, x: number, y: number) => void> = new Map<string, (scale: number, x: number, y: number) => void>();

    // putting all of the boilerplate in here
    constructor(nodeContext: LocationContext<LocationUnit>, anchor: SVGSVGElement, config: MapEditorMapConfig) {
        this.nodeContext = nodeContext;

        const gridCoords = {
            topL: new Coordinate(nodeContext.domain.x.min, nodeContext.domain.y.min),
            topR: new Coordinate(nodeContext.domain.x.max, nodeContext.domain.y.min),
            bottomL: new Coordinate(nodeContext.domain.x.min, nodeContext.domain.y.max),
            bottomR: new Coordinate(nodeContext.domain.x.max, nodeContext.domain.y.max)
        }

        // defines extents of background
        const bgCoords = {
            topL: new Coordinate(gridCoords.topL.x - 150, gridCoords.topL.y - 150),
            topR: new Coordinate(gridCoords.topR.x + 150, gridCoords.topR.y - 150),
            bottomL: new Coordinate(gridCoords.bottomL.x - 150, gridCoords.bottomL.y + 150),
            bottomR: new Coordinate(gridCoords.bottomR.x + 150, gridCoords.bottomR.y + 150)
        };

        // background for event tracking
        const backgroundElement = select(anchor)
            .append(SVGTags.SVGGElement)
            .attr(SVGAttrs.id, mapEditorMapCSS.BG_ELEM_ID)
            .append(SVGTags.SVGRectElement)
            .attr(SVGAttrs.x, bgCoords.topL.x)
            .attr(SVGAttrs.y, bgCoords.topL.y)
            .attr(SVGAttrs.width, bgCoords.topL.distance(bgCoords.topR))
            .attr(SVGAttrs.height, bgCoords.topL.distance(bgCoords.bottomL))
            .attr(SVGAttrs.fill, config.backgroundColor);

        const mainGroup = select(anchor)
            .append(SVGTags.SVGGElement)
            .attr(SVGAttrs.id, mapEditorMapCSS.MAIN);

        this.mainGroup = mainGroup;

        backgroundElement.call(
            zoom<any, unknown>()
                .scaleExtent([0.5, 2])
                .translateExtent([
                    [bgCoords.topL.x - config.zoomBuffer, bgCoords.topL.y - config.zoomBuffer],
                    [bgCoords.bottomR.x + config.zoomBuffer, bgCoords.bottomR.y + config.zoomBuffer]
                ])
                .on("zoom", (event: any) => {
                    mainGroup.attr("transform", event.transform.toString());

                    for (let handler of this.zoomHandlers.values()) {
                        handler(event.transform.k, event.transform.x, event.transform.y);
                    }

                })
        );

        // draw grid
        const gridGroup = mainGroup.append(SVGTags.SVGGElement)
            .attr(SVGAttrs.id, mapEditorMapCSS.GRID_ID)
            .attr(SVGAttrs.pointerEvents, mapEditorMapCSS.POINTER_EVENTS);


        gridGroup.append(SVGTags.SVGRectElement)
            .attr(SVGAttrs.x, gridCoords.topL.x)
            .attr(SVGAttrs.y, gridCoords.topL.y)
            .attr(SVGAttrs.height, gridCoords.topL.distance(gridCoords.bottomL))
            .attr(SVGAttrs.width, gridCoords.topL.distance(gridCoords.topR))
            .attr(SVGAttrs.fill, config.foregroundColor);

        const drawGrid = (context: Path): Path => {
            const xDomain = this.nodeContext.domain.x,
                yDomain = this.nodeContext.domain.y;

            for (let col = xDomain.min; xDomain.contains(col); col += xDomain.step) {
                context.moveTo(col, yDomain.min);
                context.lineTo(col, yDomain.max);
            }

            for (let row = yDomain.min; yDomain.contains(row); row += yDomain.step) {
                context.moveTo(xDomain.min, row);
                context.lineTo(xDomain.max, row);
            }

            return context;
        };

        gridGroup.append(SVGTags.SVGPathElement)
            .classed(mapEditorMapCSS.GRID_CLS, true)
            .attr(SVGAttrs.d, drawGrid(path()).toString());


        // append edges svg group first to respect rendering order
        this.edgeContainer = mainGroup.append(SVGTags.SVGGElement)
            .attr(SVGAttrs.id, mapEditorMapCSS.EDGE_CONTAINER_ID);

        // append nodes svg group
        this.nodeContainer = mainGroup.append(SVGTags.SVGGElement)
            .attr(SVGAttrs.id, mapEditorMapCSS.NODE_CONTAINER_ID)
            .classed(mapEditorMapCSS.NODE_CONTAINER_CLS, true);

        // attach nodes already in context to group
        nodeContext.nodes.forEach(n => this.initializeLocationNode(n));

        // append and instantiate all elements of the bottom menu
        this.initBottomMenu(anchor);

        // instantiate tooltip
        this.initializeTooltip(anchor);
        
    }

    /** Constructs and mounts bottom menu */
    private initBottomMenu(anchor: SVGSVGElement): void {
        // todo: make generic for types and content of buttons
        const mainContainerProperties = new RectConfig(
            C(5, 82),
            90,
            100 - 85
        );

        const makeTemporaryNode = (): LocationUnit => {

            const n = new LocationUnit(
                "click_to_change_name",
                "temp_node_" + (this.nodeContext.nodes.size + 1),
                Rectangle.fromCorners(
                    prevBoxConfig.bounds.topLeft,
                    prevBoxConfig.bounds.topLeft.copy.translateBy(prevBoxConfig.height, prevBoxConfig.width)
                ),
                prevBoxConfig.height * 0.35
            );

            n.shouldDisplayLabel = false;

            return n;
        };


        const menuContext: MenuContext = new MenuContext(mainContainerProperties);
        menuContext.onNodeRemoval = (node: LocationUnit) => {
            this.nodeContext.add(node);

            // reverse transforms to place node in correct coordinate
            const g: SVGGElement = this.mainGroup.node();
            const hasTransforms = g.transform.baseVal.numberOfItems == 2;
            const translation: {
                x: number,
                y: number
            } = hasTransforms ? {
                x: g.transform.baseVal.getItem(0).matrix.e,
                y: g.transform.baseVal.getItem(0).matrix.f
            } : {
                x: 0,
                y: 0
            };
            const scale: number = hasTransforms ? g.transform.baseVal.getItem(1).matrix.a : 1;


            node.translateBy(-(translation.x), -(translation.y));
            node.translateTo(node.x / scale, node.y / scale);

            this.initializeLocationNode(node);

            // create new temporary node in its place
            const temporaryNode = makeTemporaryNode();
            menuContext.add(temporaryNode);
            temporaryNode.attachDepictionTo(gameUnitBox);

        };

        const selection = select(anchor)
            .append(SVGTags.SVGGElement)
            .classed(mapEditorMapCSS.BOTTOM_MENU, true);


        // main container
        rect(selection, mainContainerProperties);
        const gameUnitBox = selection.append(SVGTags.SVGGElement)
            .classed(mapEditorMapCSS.GAME_UNIT_BOX, true);

        // add boxes
        const boxLength = mainContainerProperties.height / 2.5;
        const prevBoxConfig = new RectConfig(mainContainerProperties.bounds.topLeft.copy.translateBy(1,1), boxLength, boxLength);
        prevBoxConfig.stroke = "none";
        prevBoxConfig.fill = "#dbdbdb"
        const boxSelection = rect(gameUnitBox, prevBoxConfig);
        const temporaryNode = makeTemporaryNode();
        menuContext.add(temporaryNode);
        temporaryNode.attachDepictionTo(gameUnitBox);

    }

    /** attaches depictions, and associates handlers to toggle lable and refresh edge endpoints */
    private initializeLocationNode(n: LocationUnit): void {

        // attach depictions
        n.attachDepictionTo(this.nodeContainer);
        n.attachEdgeDepictionTo(this.edgeContainer);
        n.shouldDisplayLabel = true;

        const refreshEndpoints = {
            key: "refresh_edge_endpoints",
            apply: () => {

                this.nodeContext.nodes.forEach(nodeInContext => {

                    if (!nodeInContext.equals(n) && nodeInContext.isAdjacent(n)) nodeInContext.refreshEdgeDepiction();

                });

            }
        }

        // detect when nodes move and react to it
        n.onDrag(refreshEndpoints.key, refreshEndpoints.apply);
        n.onDragEnd(refreshEndpoints.key, () => refreshEndpoints.apply());

    }

    /** instantiates the tooltip */
    private initializeTooltip(anchor: SVGSVGElement): void {

        const hideTooltip = {
            key: "hide_tooltip",
            apply: (delay: number = 1000) => () => {
                // desociate node
                targetNode = undefined;

                selection.interrupt(showTooltip.key).transition(hideTooltip.key).delay(delay).attr(SVGAttrs.display, LocationUnitCSS.NONE);
            }
        };

        const showTooltip = {
            key: "show_tooltip",
            apply: (delay: number = 1000) => () => selection
                .interrupt(hideTooltip.key)
                .transition(showTooltip.key)
                .delay(delay)
                .duration(0)
                .attr(SVGAttrs.display, LocationUnitCSS.INLINE)
        };

        const removeNode = {
            key: "remove_node",
            apply: (n: LocationUnit) => this.nodeContext.rm(n.id),
            btnColor: "red"
        };

        const moveTooltipToNode = {
            key: "move_tooltip_to_node",
            apply: (delay: number, node: LocationUnit) => () => {

                // reverse transforms to place node in correct coordinate
                const g: SVGGElement = this.mainGroup.node();
                const hasTransforms = g.transform.baseVal.numberOfItems == 2;
                const translation: {
                    x: number,
                    y: number
                } = hasTransforms ? {
                    x: g.transform.baseVal.getItem(0).matrix.e,
                    y: g.transform.baseVal.getItem(0).matrix.f
                } : {
                    x: 0,
                    y: 0
                };
                const scale: number = hasTransforms ? g.transform.baseVal.getItem(1).matrix.a : 1;

                // move bounding square to node
                const target = new Coordinate(node.x, node.y - node.radius - 0.4);
                // properties.translateToCoord(target);

                properties.translateToCoord(target.translateTo(target.x * scale, target.y * scale));
                properties.translateToCoord(target.translateBy(translation.x, translation.y));

                // update attributes accordingly
                showTooltip.apply(delay)()

                mainTooltipContainer
                    .transition()
                    .delay(delay)
                    .duration(0)
                    .attr(SVGAttrs.x, properties.bounds.topLeft.x)
                    .attr(SVGAttrs.y, properties.bounds.topLeft.y);

                actionBtnRect
                    .transition()
                    .delay(delay)
                    .duration(0)
                    .attr(SVGAttrs.x, (action) => properties.getConfigForAction(action.key).bounds.topLeft.x)
                    .attr(SVGAttrs.y, (action) => properties.getConfigForAction(action.key).bounds.topLeft.y)
                    .attr(SVGAttrs.fill, (action) => action.btnColor);

                tip.transition()
                    .delay(delay)
                    .duration(0)
                    .attr(SVGAttrs.d, () => {
                        const p = path();

                        p.moveTo(properties.tipStart.x, properties.tipStart.y);
                        p.lineTo(properties.tip.x, properties.tip.y);
                        p.lineTo(properties.tipEnd.x, properties.tipEnd.y);

                        return p.toString();
                    });

            }
        }

        // the node to which the tooltip refers to
        let targetNode: LocationUnit | undefined = undefined;

        // when graph zooms, move tooltip to node
        this.zoomHandlers.set(hideTooltip.key, hideTooltip.apply(0))

        const actions = [
            removeNode
        ];

        const properties = new TooltipConfig(
            C(0,2),
            8,
            actions.map(_ => _.key)
        ).withFill("black");

        const selection = select(anchor)
            .append(SVGTags.SVGGElement)
            .classed(mapEditorMapCSS.TOOLTIP, true)
            .attr(SVGAttrs.display, LocationUnitCSS.NONE)
            .on("mouseover", () => selection.interrupt(hideTooltip.key))
            .on("mouseleave", hideTooltip.apply());

        const mainTooltipContainer = rect(selection, properties);

        // map each action to a button
        const actionButtons = selection.selectAll("." + mapEditorMapCSS.TOOLTIP_ACTION_BUTTON)
            .data(actions, (a: any) => a.key)
            .enter();

        // draw tip, starting from half - 5%, going down x units, up into half + 5%, close
        const tip = selection.append<SVGPathElement>(SVGTags.SVGPathElement)
            .attr(SVGAttrs.fill, properties.fill)
            .attr(SVGAttrs.d, () => {
                const p = path();

                p.moveTo(properties.tipStart.x, properties.tipStart.y);
                p.lineTo(properties.tip.x, properties.tip.y);
                p.lineTo(properties.tipEnd.x, properties.tipEnd.y);

                return p.toString();
            });

        const actionBtnRect: Selection<SVGRectElement, {
            key: string,
            btnColor: string
        }, any, any> = rect(actionButtons, properties.getConfigForAction(""));

        // handle reactivity
        for (let node of this.nodeContext.nodeArr()) {

            // assign local variable

            node.onMouseIn(moveTooltipToNode.key, moveTooltipToNode.apply(400, node));

            node.onMouseOut(hideTooltip.key, hideTooltip.apply());

            node.onDragStart(hideTooltip.key, hideTooltip.apply(0));

            node.onDragEnd(moveTooltipToNode.key, moveTooltipToNode.apply(0, node));

        }

    }
    
}