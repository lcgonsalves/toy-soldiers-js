
import {pointer, Selection} from "d3-selection";
import SVGTags from "./SVGTags";
import SVGAttrs from "./SVGAttrs";
import AssetLoader from "../game/map/internal/AssetLoader";
import {C, Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {IGraphNode} from "ts-shared/build/graph/GraphInterfaces";
import Rectangle from "ts-shared/build/geometry/Rectangle";
import {PayloadRectangle} from "ts-shared/build/geometry/Payload";
import {sq} from "ts-shared/build/util/Shorthands";
import {SimpleDepiction} from "./Depiction";
import {fromEvent, Subscription} from "rxjs";
import {Events} from "./Events";
import {map} from "rxjs/operators";

export type AnySelection = Selection<any, any, any, any>;

export class RectConfig {
    bounds: Rectangle;
    width: number;
    height: number;
    cls: string;
    fill: string = "white";
    stroke: string = "black";
    strokeWidth: number = 0.4;
    rx: number = 0.2;

    constructor(topLeft: ICoordinate, width: number, height: number, cls: string = "") {
        this.bounds = Rectangle.fromCorners(topLeft, topLeft.copy.translateBy(width, height));
        this.width = width;
        this.height = height;
        this.cls = cls;
    }

    withStroke(s: string): this {

        this.stroke = s;
        return this;

    }

    withFill(f: string): this {

        this.fill = f;
        return this;

    }

    withStrokeWidth(sw: number): this {

        this.strokeWidth = sw;
        return this;

    }

    withRx(rx: number): this {

        this.rx = rx;
        return this;

    }

}

export class TooltipConfig extends RectConfig {
    tip: ICoordinate;
    tipStart: ICoordinate;
    tipEnd: ICoordinate;
    buttonRadius: number = 4;
    buttonMargin: number = 0.4;

    get buttonDiameter(): number { return this.buttonRadius * 2 }

    constructor(
        topLeft: ICoordinate, 
        buttonRadius: number,
        buttonMargin: number
    ) {
        // by default, fits 2 buttons
        super(
            topLeft,
            (2 * (2 * buttonRadius)) + (3 * buttonMargin),
            (2 * buttonRadius) + (2 * buttonMargin)
        );

        this.tipStart = this.bounds.bottomLeft.copy.translateBy(this.width * 0.62, -(this.height * 0.1));
        this.tipEnd = this.bounds.bottomRight.copy.translateBy(-(this.width * 0.62), -(this.height * 0.1));
        this.tip = this.bounds.bottomLeft.copy.translateBy(this.width / 2, 1.2);
        this.buttonRadius = buttonRadius;
        this.rx = this.height / 2

    }

    /** translates bounds and tip representations to given coordinate */
    translateToCoord(c: ICoordinate): TooltipConfig {

        // get distance from tip to target
        const dist = this.tip.distanceInComponents(c);
        return this.translateBy(dist.x, dist.y);

    }

    translateBy(x: number, y: number): TooltipConfig {

        // translate all other components by the parameters
        [
            this.tip,
            this.tipStart,
            this.tipEnd,
            this.bounds
        ].forEach(location => {
                location.translateBy(x, y)
        });

        return this;

    }

}

/**
 * Maps the event of a mousemove into an ICoordinate. Don't forget to unsubscribe!
 * @param elem
 * @param callback
 */
export function followMouseIn(elem: SVGElement, callback: (mousePositionInContext: ICoordinate) => void): Subscription {

    return fromEvent<Event>(elem, Events.mousemove)
        .pipe<ICoordinate>(
            map((event: Event): ICoordinate => {
                const [x, y] = pointer(event);
                return C(x,y);
            })
        ).subscribe(callback);

}

export class DockConfig extends RectConfig {
    readonly margin: number;
    readonly dockItemContainerConfig: RectConfig;
    title: string = "Untitled";
    secondaryColor: string;

    get primaryColor(): string { return this.fill }

  constructor(
      topLeft: ICoordinate,
      width: number,
      height: number,
      margin: number,
      dockItemContainerConfig: RectConfig,
      primaryColor: string = "#e5e5e5",
      secondaryColor: string = primaryColor,
      cls?: string
    ) {
    super(topLeft, width, height, cls);
    this.fill = primaryColor;
    this.secondaryColor = secondaryColor;
    this.margin = margin;
    this.dockItemContainerConfig = dockItemContainerConfig;
  }

  rename(x: string): this {
      this.title = x;
      return this;
  }

}

/** Returns coordinate of point (x1,y1) as defined in the usage of d3.path().arcTo() from a given curvature degree parameter */
export function getArcToTangentPoint(from: IGraphNode, to: IGraphNode, intersectingNode?: IGraphNode, bufferRadius: number = 0): ICoordinate {

    const midpoint = from.midpoint(to);
    const curvature = intersectingNode ? intersectingNode.radius + bufferRadius : 0;

    const perpendicularVec = from.perpendicularVector(midpoint);

    const radius = (4 * sq(curvature) + sq(from.distance(to))) / (8 * curvature);
    const degree = radius - curvature;
    const ratio = perpendicularVec.length() / degree;
    const finalVectorA = perpendicularVec.scale(ratio);
    const finalVectorB = finalVectorA.scale(-1);


    // pick final vector based on the shortest distance between apex and intersecting node coord
    let finalVector = intersectingNode &&
    finalVectorA.getEndpoint(midpoint).distance(intersectingNode) >
    finalVectorB.getEndpoint(midpoint).distance(intersectingNode) ?
        finalVectorA :
        finalVectorB;

    return finalVector.getEndpoint(midpoint);

}

export function getCurveRadius(from: IGraphNode, to: IGraphNode, intersectingNode?: IGraphNode, bufferRadius: number = 0): number {
    const curvature = intersectingNode ? intersectingNode.radius + bufferRadius : 0;
    return (4 * sq(curvature) + sq(from.distance(to))) / (8 * curvature);
}

export function getTransforms(s?: AnySelection): {scale: number, translation: {x: number, y: number}} {

    const g: SVGGElement = s?.node();
    const hasTransforms = g?.transform.baseVal.numberOfItems == 2;
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

    return {
        translation,
        scale
    }

}

/**
 * The first generic refers to the datum contained within the payload. This datum must
 * The second indicates what kind of container is being used.
 * The third refers to the type of SVG container to which the icon will be appended to.
 * @param selection the selection in which the icons are supposed to be rendered in
 * @param getIconKey function should receive a datum and output a key that will be used to fetch the icon.
 */
export function renderIconForSelection<
    Datum,
    Container extends PayloadRectangle<Datum>,
    Element extends SVGGElement
    >(
        selection: Selection<Element, Container, any, any>,
        getIconKey: (d: Datum) => string,
        depiction: SimpleDepiction
): void {

    const boundsToRender = selection.data() ?? [];
    const svgNodes = selection.nodes() ?? [];

    if (boundsToRender.length !== svgNodes.length) {
        console.error("Incompatible number of svg nodes and associated bounds!");
        return;
    }

    svgNodes.forEach((svgN, i) => {

        const bound = boundsToRender[i];
        const key = getIconKey(bound.payload);
        const asset = AssetLoader.getIcon(key, bound, depiction.fill);


        if (asset) svgN.appendChild(asset);

    });

}

/** shorthand for drawing a rectangle in d3 */
export function rect(selection: AnySelection, rectConfig: RectConfig): Selection<SVGRectElement, any, any, any> {

    const {
        bounds,
        width,
        height,
        fill,
        stroke,
        strokeWidth,
        rx
    } = rectConfig;

    const {topLeft} = bounds;

    return selection.append<SVGRectElement>(SVGTags.SVGRectElement)
        .attr(SVGAttrs.x, topLeft.x)
        .attr(SVGAttrs.y, topLeft.y)
        .attr(SVGAttrs.width, width)
        .attr(SVGAttrs.height, height)
        .attr(SVGAttrs.fill, fill)
        .attr(SVGAttrs.stroke, stroke)
        .attr(SVGAttrs.strokeWidth, strokeWidth)
        .attr(SVGAttrs.rx, rx);

}

const defaultDockWidth = 90;
const defaultDockItemSize = defaultDockWidth / 15;

export const defaultColors = {
    primary: "#1493ff",
    error: "#ff3e44",
    success: "#0fa500",
    grays: {
        extralight: "#e5e5e5",
        light: "#c0c0c0",
        medium: "#a9a9a9",
        dark: "#8c8c8c",
        extradark: "#525252",
        superextradark: "#282828"
    },
    text: {
        light: "#f7f7f7",
        dark: "#505050"
    }
}

export const defaultDepictions = {
    grays: {
        light: new SimpleDepiction(defaultColors.grays.light, defaultColors.grays.dark, 1, 1),
        medium: new SimpleDepiction(defaultColors.grays.medium, defaultColors.grays.dark, 1, 1),
        dark: new SimpleDepiction(defaultColors.grays.dark, defaultColors.grays.extradark, 1, 1),
    },
    noFill: {
        grays: {
            light: new SimpleDepiction("none", defaultColors.grays.light, 1, 1),
            medium: new SimpleDepiction("none", defaultColors.grays.dark, 1, 1),
            dark: new SimpleDepiction("none", defaultColors.grays.superextradark, 1, 1)
        }
    }
}

const defaultDockItemContainerConfig = new RectConfig(
    C(0,0),
    defaultDockItemSize,
    defaultDockItemSize
).withFill(defaultColors.grays.light).withRx(0.3);

export const defaultConfigurations = {
    /** Default configuration of a dock item container */
    dockItemContainer: defaultDockItemContainerConfig,
    /** Default configuration of the Dock */
    dock: new DockConfig(
        C(5, 85),
        defaultDockWidth,
        100 - 85,
        0.6,
        defaultDockItemContainerConfig,
        defaultColors.grays.extralight,
        defaultColors.grays.light
    ).withStroke(defaultColors.grays.medium),
    tooltip: new TooltipConfig(Coordinate.origin, 2.5, 0.3).withFill(defaultColors.grays.extradark).withStroke("none")
}


