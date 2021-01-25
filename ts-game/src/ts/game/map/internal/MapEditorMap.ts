import {LocationContext} from "ts-shared/build/lib/mechanics/Location";
import {C, Coordinate} from "ts-shared/build/lib/geometry/Coordinate";
import {BaseType, select, Selection} from "d3-selection";
import SVGAttrs from "../../../util/SVGAttrs";
import SVGTags from "../../../util/SVGTags";
import {GameMapHelpers} from "../GameMapHelpers";
import {zoom} from "d3-zoom";
import {path, Path} from "d3-path";
import LocationUnit from "../../units/LocationUnit";
import {AnySelection, rect, RectConfig} from "../../../util/DrawHelpers";
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
    GRID_ID = "grid_element",
    GRID_CLS = "grid",
    NODE_CONTAINER_ID = "nodes",
    NODE_CONTAINER_CLS = "node",
    POINTER_EVENTS = "none",
    EDGE_CONTAINER_ID = "edges",
    GAME_UNIT_BOX = "game_unit_box",
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
                .on("zoom", (event: any) => mainGroup.attr("transform", event.transform.toString()))
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
    
}