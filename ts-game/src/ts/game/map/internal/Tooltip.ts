import { path } from "d3";
import { C, Coordinate, ICoordinate } from "ts-shared/build/lib/geometry/Coordinate";
import Rectangle, {RectangleCorners} from "ts-shared/build/lib/geometry/Rectangle";
import IComparable from "ts-shared/build/lib/util/IComparable";
import Vector from "ts-shared/build/lib/util/Vector";
import { SimpleDepiction } from "../../../util/Depiction";
import { AnySelection, defaultColors, defaultConfigurations, rect, RectConfig, TooltipConfig } from "../../../util/DrawHelpers";
import SVGAttrs from "../../../util/SVGAttrs";
import SVGTags from "../../../util/SVGTags";
import { DragEvents, IDepictable } from "../../units/UnitInterfaces";

enum TooltipCSS {
    TOOLTIP = "tooltip",
    DISPLAY_HIDE = "none",
    DISPLAY_SHOW = "block",
    BUTTONS_CONTAINER_CLS = "tooltip_button_container",
    BUTTON_CLS = "tooltip_button"
}

/**
 * Tooltip that displays buttons that are actions.
 */
export class ActionTooltip extends Rectangle implements IDepictable {
    private config: TooltipConfig;
    private anchor: AnySelection | undefined;
    private visible: boolean = false;
    private activeButtons: number = 0;
    private delayToUpdate: number = 0;

    constructor(config: TooltipConfig = defaultConfigurations.tooltip) {

        // initialize bounds to copy config
        super(
            config.bounds.topLeft,
            config.bounds.topRight,
            config.bounds.bottomLeft,
            config.bounds.bottomRight
        );

        this.config = config;

    }

    /**
     * Moves the tooltip to the desired target, displays tooltip, and generates buttons
     * for the actions passed to it. If an empty array of actions is passed, the tooltip will not be displayed.
     * @param target element to be moved towards
     * @param actions actions that can be performed on this target upon focus
     * @param anchorPoint (optional) point where the tip of the tooltip should be at
     */
    focus<Target extends ICoordinate>(
        target: Target, 
        actions: GenericAction<Target>[], 
        anchorPoint: ICoordinate = target,
        delayMs: number = this.delayToUpdate
    ): void {

        this.visible = actions.length > 0;
        if (!this.visible) return;

        this.delayToUpdate = delayMs;
        
        const dataJoin = this.anchor?.interrupt().select("." + TooltipCSS.BUTTONS_CONTAINER_CLS)
            .selectAll<SVGCircleElement, GenericAction<Target>>("." + TooltipCSS.BUTTON_CLS)
            .data<GenericAction<Target>>(actions, _ => _.key);

        const {
            buttonMargin,
            buttonRadius,
            buttonDiameter
        } = this.config;

        const newWidth: number = buttonMargin + (actions.length * (buttonDiameter + buttonMargin));

        // set width to fit new params
        this.setWidth(newWidth);

        const {
            topLeft,
            bottomLeft
        } = this.translateToCoord(anchorPoint ? anchorPoint : target);

        const mid = topLeft.midpoint(bottomLeft).translateBy(buttonMargin + buttonRadius, 0);

        // new buttons
        dataJoin?.enter()
            .append(SVGTags.SVGCircleElement)
            .classed(TooltipCSS.BUTTON_CLS, true)
            .on("click", function(evt: any, action: GenericAction<Target>) {
                action.apply(target);
            })
            .attr(SVGAttrs.cx, (_, index) => mid.copy.translateBy(index * (buttonDiameter + buttonMargin), 0).x)
            .attr(SVGAttrs.cy, (_, index) => mid.y)
            .transition()
            .delay(delayMs)
            .attr(SVGAttrs.r, buttonRadius)
            .attr(SVGAttrs.fill, _ => _.depiction.fill)
            .attr(SVGAttrs.stroke, _ => _.depiction.stroke)
            .attr(SVGAttrs.strokeWidth, _ => _.depiction.strokeWidth);

        dataJoin?.exit().remove();

        dataJoin?.attr(SVGAttrs.cx, (_, index) => mid.copy.translateBy(index * (buttonDiameter + buttonMargin), 0).x)
            .attr(SVGAttrs.cy, (_, index) => mid.y)
            .attr(SVGAttrs.r, buttonRadius)
            .transition()
            .delay(delayMs)
            .attr(SVGAttrs.fill, _ => _.depiction.fill)
            .attr(SVGAttrs.stroke, _ => _.depiction.stroke)
            .attr(SVGAttrs.strokeWidth, _ => _.depiction.strokeWidth)

    }

    /**
     * Makes tooltip ~*disappear*~, if not being hovered over currently.
     * Can force to disappear evenwhen hovering by passing the parameter force.
     */
    unfocus(delayMs: number = this.delayToUpdate, force?: boolean): void {
        this.anchor?.interrupt()
                    .transition("unfocus")
                    .delay(delayMs)
                    .attr(SVGAttrs.display, TooltipCSS.DISPLAY_HIDE);
    }

    translateTo(x: number, y: number): this {
        return this.translateToCoord(C(x,y));
    }

    /** Moves tooltip to a given coordinate, returning itself for chaining. */
    translateToCoord(other: ICoordinate): this {
        // todo: use bounds once, then use internal state to track position
        const dist = this.config.tip.distanceInComponents(other);
        return this.translateBy(dist.x, dist.y);
    }

    /** Moves tooltip by a given amount, returning itself for chaining. */
    translateBy(x: number, y: number): this {
        const {tip, tipStart, tipEnd, bounds} = this.config;
        [tip, tipStart, tipEnd, bounds].forEach(_ => _.translateBy(x, y));
        super.translateBy(x,y);

        // update depiction
        this.refresh();
        return this;
    }

    /* IDepictable Methods */

    attachDepictionTo(d3selection: AnySelection): void {

        // initialize svg g element to a hidden state
        const selection = d3selection
            .append(SVGTags.SVGGElement)
            .classed(TooltipCSS.TOOLTIP, true)
            .attr(SVGAttrs.display, this.visible ? TooltipCSS.DISPLAY_SHOW : TooltipCSS.DISPLAY_HIDE)
            .on("mouseenter", () => {
                // prevent tooltip from losing focus when hovering
                this.anchor?.interrupt("unfocus");

            })
            .on("mouseleave", () => {
                // unfocus automatically on leave
                this.unfocus(450);
            });

        // append rectangle with default configuraion
        rect(selection, this.config);

        // append path with no 'd'
        selection.append<SVGPathElement>(SVGTags.SVGPathElement)
            .attr(SVGAttrs.fill, this.config.fill)
            .attr(SVGAttrs.stroke, this.config.stroke)
            .attr(SVGAttrs.rx, this.config.rx)
            .attr(SVGAttrs.d, (): string => {
                const {
                    tipStart,
                    tipEnd,
                    tip
                } = this.config;
                
                const p = path();

                p.moveTo(tipStart.x, tipStart.y);
                p.lineTo(tip.x, tip.y);
                p.lineTo(tipEnd.x, tipEnd.y);

                return p.toString();
            });


        // add last for rendering order
        selection.append(SVGTags.SVGGElement)
            .classed(TooltipCSS.BUTTONS_CONTAINER_CLS, true);
        
        // save reference
        this.anchor = selection;

    }

    deleteDepiction(): void {
        this.anchor?.remove();
    }

    refresh(): void {

        const s = this.anchor;

        s?.transition().delay(this.delayToUpdate).attr(SVGAttrs.display, this.visible);

        s?.select(SVGTags.SVGRectElement)
            .attr(SVGAttrs.x, this.topLeft.x)
            .attr(SVGAttrs.y, this.topLeft.y)
            .attr(SVGAttrs.width, this.width);
        
        s?.select(SVGTags.SVGPathElement)
            .attr(SVGAttrs.d, (): string => {
                const {
                    tipStart,
                    tipEnd,
                    tip
                } = this.config;
                
                const p = path();

                p.moveTo(tipStart.x, tipStart.y);
                p.lineTo(tip.x, tip.y);
                p.lineTo(tipEnd.x, tipEnd.y);

                return p.toString();
            });
        

    }

}


export class GenericAction<Target> {

    public readonly key: string;
    public readonly name: string;
    public readonly apply: (t: Target) => void;
    public depiction: SimpleDepiction = GenericAction.depiction.neutral;

    constructor(key: string, name: string, fn: (t: Target) => void) {
        this.apply = fn;
        this.key = key;
        this.name = name;
    };

    // default kinds of action depictions
    public static depiction = {
        main: new SimpleDepiction(defaultColors.primary),
        delete: new SimpleDepiction(defaultColors.error),
        neutral: new SimpleDepiction(defaultColors.neutral)
    }

}

// shorthand the constructor
export function action<Target>(key: string, name: string, fn: (t: Target) => void): GenericAction<Target> { return new GenericAction(key, name, fn) }
