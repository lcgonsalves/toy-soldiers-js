import {LocationContext} from "ts-shared/build/lib/mechanics/Location";
import {C, Coordinate} from "ts-shared/build/lib/geometry/Coordinate";
import {BaseType, pointer, select, Selection} from "d3-selection";
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
interface Action {
    key: string,
    apply: (n: LocationUnit) => void
}

enum mapEditorMapCSS {
    BG_ELEM = "bg_elememnt",
    MAIN_ELEM = "main_element",
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
 * AKA: dumping zone for stuff I have no clue where should be defined.
 */
export class MapEditorMap {
    // contexts
    public readonly nodeContext: LocationContext<LocationUnit>;

    // anchors
    private readonly edgeContainer: AnySelection;
    private readonly nodeContainer: AnySelection;
    private readonly mainGroup: AnySelection;

    private readonly zoomHandlers: Map<string, (scale: number, x: number, y: number) => void> = new Map<string, (scale: number, x: number, y: number) => void>();

    private tooltipFocusedOn: LocationUnit | undefined;

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
            .classed(mapEditorMapCSS.BG_ELEM, true)
            .append(SVGTags.SVGRectElement)
            .attr(SVGAttrs.x, bgCoords.topL.x)
            .attr(SVGAttrs.y, bgCoords.topL.y)
            .attr(SVGAttrs.width, bgCoords.topL.distance(bgCoords.topR))
            .attr(SVGAttrs.height, bgCoords.topL.distance(bgCoords.bottomL))
            .attr(SVGAttrs.fill, config.backgroundColor);

        const mainGroup = select(anchor)
            .append(SVGTags.SVGGElement)
            .classed(mapEditorMapCSS.MAIN_ELEM, true);

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
        n.onDragEnd(refreshEndpoints.key, refreshEndpoints.apply);

    }

    /** instantiates the tooltip */
    private initializeTooltip(anchor: SVGSVGElement): void {

        // todo: I gotta expose these methdos so new nodes can have the tooltip focus on them too.

        /** when remove button is clicked, this is what happens */
        const removeNode = {
            key: "remove_node",
            apply: (n: LocationUnit) => {

                this.nodeContext.rm(n.id);
                const adj = this.nodeContext.getNodesAdjacentTo(n);

                adj.forEach(adj => adj.disconnectFrom(n, true))

                n.deleteDepiction();
                n.deleteEdgeDepiction();

                setCurrentNode(undefined);

                hideTooltip.apply(0)();

            },
            btnColor: "#c86969"
        };

        const startConnection = {
            key: "start_connection",
            apply: (n: LocationUnit) => {

                // hide overlay
                hideTooltip.apply(0)();

                const context = this.nodeContext;

                // connect to temporary invisible node to follow mouse
                const temp = new LocationNode("temp", 0, n.x, n.y);
                n.connectTo(temp);

                // create listener on background to track mouse movement
                select(anchor).select("." + mapEditorMapCSS.BG_ELEM)
                    .on("mousemove", function (evt: any) {

                        const [x,y] = pointer(evt);
                        const pointerCoordinate = C(x, y);

                        const possibleTargets = context.getNodesInVicinity(pointerCoordinate,8);

                        temp.translateToCoord(possibleTargets.length > 0 ? possibleTargets[0] : pointerCoordinate);
                        n.refreshEdgeDepiction();

                        deactivateTooltipReactivity();

                        for (let target of possibleTargets) {

                            const callbackName = "allow_attachment";

                            target.draggable = false;
                            target.onMouseClick(callbackName, () => {

                                // disable mouse tracker
                                select(anchor).select("." + mapEditorMapCSS.BG_ELEM)
                                    .on("mousemove", null);

                                // connect!
                                n.connectTo(target);

                                // disconnect from other
                                n.disconnectFrom(temp);

                                for (let t of possibleTargets) {
                                    console.log("reactivating drag for " + t.toString())
                                    t.draggable = true;
                                    target.removeOnMouseClick(callbackName);
                                }

                                activateTooltipReactivity();

                            });

                        }

                    });


            },
            btnColor: "#3489db"
        };

        const hideTooltip = {
            key: "hide_tooltip",
            apply: (delay: number = 1000) => () => {
                selection.interrupt(showTooltip.key)
                    .transition(hideTooltip.key)
                    .delay(delay)
                    .attr(SVGAttrs.display, LocationUnitCSS.NONE);
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

        const moveTooltipToNode = {
            key: "move_tooltip_to_node",
            apply: (delay: number, node: LocationUnit) => () => {
                // assign current node to this
                setCurrentNode(node);

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
                    .attr(SVGAttrs.stroke, "none")
                    .attr(SVGAttrs.fill, (action) => action.btnColor);

                actionBtnLabel
                    .transition()
                    .delay(delay)
                    .duration(0)
                    .attr(SVGAttrs.x, (action) => {
                        const bounds = properties.getConfigForAction(action.key).bounds;

                        const centerBottom = bounds.bottomLeft.midpoint(bounds.bottomRight);
                        const centerTop = bounds.topLeft.midpoint(bounds.topRight);

                        return centerBottom.midpoint(centerTop).x

                    })
                    .attr(SVGAttrs.y, (action) => {
                        const bounds = properties.getConfigForAction(action.key).bounds;

                        const centerBottom = bounds.bottomLeft.midpoint(bounds.bottomRight);
                        const centerTop = bounds.topLeft.midpoint(bounds.topRight);

                        return centerBottom.midpoint(centerTop).y + (centerBottom.distance(centerTop) / 5)
                    })
                    .attr("text-anchor", "middle")
                    .attr(SVGAttrs.fill, "white");

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

        // when graph zooms, move tooltip to node
        this.zoomHandlers.set(hideTooltip.key, hideTooltip.apply(0))

        const actions: Action[] = [
            startConnection,
            removeNode
        ];

        const properties = new TooltipConfig(
            C(0,2),
            15,
            actions.map(_ => _.key)
        ).withFill("black");

        const selection = select(anchor)
            .append(SVGTags.SVGGElement)
            .classed(mapEditorMapCSS.TOOLTIP, true)
            .attr(SVGAttrs.display, LocationUnitCSS.NONE)
            .on("mouseover", () => selection.interrupt(hideTooltip.key))
            .on("mouseleave", hideTooltip.apply());

        const mainTooltipContainer = rect(selection, properties);

        const getCurrentNode = () => {
            return this.tooltipFocusedOn;
        };

        const setCurrentNode = (n: LocationUnit | undefined) => {
            this.tooltipFocusedOn = n;
        }

        // setInterval(() => console.log(getCurrentNode()), 1000);

        // map each action to a button
        const actionButtons = selection
            .selectAll("." + mapEditorMapCSS.TOOLTIP_ACTION_BUTTON)
            .data<Action>(actions, (a: any) => a.key)
            .enter()
            .append(SVGTags.SVGGElement)
            .classed(mapEditorMapCSS.TOOLTIP_ACTION_BUTTON, true)
            .on("click", function ()  {
                const action = select<any, Action>(this).datum();
                const n = getCurrentNode();

                if (n)
                    action.apply(n);

            });

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


        const actionBtnLabel = actionButtons
            .append(SVGTags.SVGTextElement)
            .text(action => action.key)
            // .attr(SVGAttrs.fontSize, 1.5)
            .attr(SVGAttrs.width, action => properties.getConfigForAction(action.key).width)
            .attr(SVGAttrs.height, action => properties.getConfigForAction(action.key).height);

        const activateTooltipReactivityFor = (node: LocationUnit) => {

            node.onMouseIn(moveTooltipToNode.key, moveTooltipToNode.apply(400, node));

            node.onMouseOut(hideTooltip.key, hideTooltip.apply());

            node.onDragStart(hideTooltip.key, hideTooltip.apply(0));

            node.onDragEnd(moveTooltipToNode.key, moveTooltipToNode.apply(0, node));

        }

        this.nodeContext.onAdd = activateTooltipReactivityFor;

        const activateTooltipReactivity = () => {

            // handle reactivity
            for (let node of this.nodeContext.nodeArr()) {

                // assign local variable
                activateTooltipReactivityFor(node);

            }

        }

        const deactivateTooltipReactivity = () => {

            for (let node of this.nodeContext.nodeArr()) {

                node.removeOnMouseIn(moveTooltipToNode.key);

                node.removeOnMouseOut(hideTooltip.key);

                node.removeOnDragStart(hideTooltip.key);

                node.removeOnDragEnd(moveTooltipToNode.key);

            }

        }

        activateTooltipReactivity();

    }
    
}


// TODO: fix pointer on delete button
// TODO: edges should react to deletion of TO-NODE
