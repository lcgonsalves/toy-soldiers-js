import { path } from "d3";
import {
    AnySelection,
    defaultColors,
    defaultConfigurations,
    getTransforms,
    rect,
    TooltipConfig
} from "../../../util/DrawHelpers";
import {C, ICoordinate} from "ts-shared/build/lib/geometry/Coordinate";
import {IDepictable} from "../../units/UnitInterfaces";
import Rectangle from "ts-shared/build/lib/geometry/Rectangle";
import SVGTags from "../../../util/SVGTags";
import {SimpleDepiction} from "../../../util/Depiction";
import SVGAttrs from "../../../util/SVGAttrs";


enum TooltipCSS {
    TOOLTIP = "tooltip",
    DISPLAY_HIDE = "none",
    DISPLAY_SHOW = "block",
    BUTTONS_CONTAINER_CLS = "tooltip_button_container",
    BUTTON_CLS = "tooltip_button"
}

enum TooltipTransitions {
    unfocus = "unfocus",
    focus = "focus",
    button_pop = "button_pop",
    refresh = "refresh"
}

/**
 * Tooltip that displays buttons that are actions.
 */
export class ActionTooltip extends Rectangle implements IDepictable {
    private config: TooltipConfig;
    private anchor: AnySelection | undefined;
    public enabled: boolean = true;
    private delayRefresh: number = 0;

    // defines the context in which the transforms will be applied to. For example, if we have nodes that have transforms, we correct for their position
    // with this selection.
    private context: AnySelection | undefined;

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

    /* Tooltip Methods */

    /**
     * Moves the tooltip to the desired target, displays tooltip, and generates buttons
     * for the actions passed to it. If an empty array of actions is passed, the tooltip will not be displayed.
     * @param target element to be moved towards
     * @param actions actions that can be performed on this target upon focus
     * @param anchorPoint (optional) point where the tip of the tooltip should be at
     * @param delayMs (optional) delay
     */
    focus<Target extends ICoordinate>(
        target: Target,
        actions: TargetAction<Target>[],
        anchorPoint: ICoordinate = target,
        delayMs: number = 0
    ): void {

        if (!actions.length || !this.enabled) return;

        const dataJoin = this.anchor?.select("." + TooltipCSS.BUTTONS_CONTAINER_CLS)
            .selectAll<SVGCircleElement, TargetAction<Target>>("." + TooltipCSS.BUTTON_CLS)
            .data<TargetAction<Target>>(actions, _ => _.key);

        const currentlyDisplaying = this.anchor?.attr(SVGAttrs.display) === TooltipCSS.DISPLAY_SHOW;

        // display tooltip
        // interrupt unfocus if there was an unfocus action in place
        this.anchor?.interrupt(TooltipTransitions.unfocus);

        // if not displaying, we transition into displaying. this is needed to avoid accidentally transitioning twice and causing the tooltip to show after unfocusing
        if (!currentlyDisplaying)
            this.anchor?.transition(TooltipTransitions.focus)
                .delay(delayMs)
                .attr(SVGAttrs.display, TooltipCSS.DISPLAY_SHOW);
        else {
            this.anchor?.interrupt(TooltipTransitions.refresh);
        }

        const {
            buttonMargin,
            buttonRadius,
            buttonDiameter
        } = this.config;

        const newWidth: number = buttonMargin + (actions.length * (buttonDiameter + buttonMargin));

        // set width to fit new params
        this.setWidth(newWidth);

        // undo contextual transforms
        const transforms = getTransforms(this.context);
        const untransformedTarget: ICoordinate = anchorPoint.copy.translateTo(
            (anchorPoint.x * transforms.scale) + transforms.translation.x,
            (anchorPoint.y * transforms.scale) + transforms.translation.y
        )

        this.delayRefresh = delayMs;

        const {
            topLeft,
            bottomLeft
        } = this.translateToCoord(untransformedTarget);

        this.delayRefresh = 0;


        const mid = topLeft.midpoint(bottomLeft).translateBy(buttonMargin + buttonRadius, 0);

        // add new buttons
        dataJoin?.enter()
            .append(SVGTags.SVGCircleElement)
            .classed(TooltipCSS.BUTTON_CLS, true)
            .on("click", function(evt: any, action: TargetAction<Target>) {
                action.apply(target);
            })
            .attr(SVGAttrs.cx, (_, index) => mid.copy.translateBy(index * (buttonDiameter + buttonMargin), 0).x)
            .attr(SVGAttrs.cy, mid.y)
            .transition(TooltipTransitions.button_pop)
            .delay(delayMs + 30)
            .attr(SVGAttrs.r, buttonRadius)
            .attr(SVGAttrs.fill, _ => _.depiction.fill)
            .attr(SVGAttrs.stroke, _ => _.depiction.stroke)
            .attr(SVGAttrs.strokeWidth, _ => _.depiction.strokeWidth);

        // remove old buttons
        dataJoin?.exit().remove();

        // update position and handler of buttons, in case the actions have changed.
        dataJoin?.attr(SVGAttrs.cx, (_, index) => mid.copy.translateBy(index * (buttonDiameter + buttonMargin), 0).x)
            .attr(SVGAttrs.cy, mid.y)
            .attr(SVGAttrs.r, buttonRadius / 1.2)
            .on("click", function(evt: any, action: TargetAction<Target>) {
                action.apply(target);
            })
            .transition(TooltipTransitions.button_pop)
            .delay(currentlyDisplaying ? 30 : delayMs + 30)
            .attr(SVGAttrs.r, buttonRadius)
            .attr(SVGAttrs.fill, _ => _.depiction.fill)
            .attr(SVGAttrs.stroke, _ => _.depiction.stroke)
            .attr(SVGAttrs.strokeWidth, _ => _.depiction.strokeWidth);

    }

    /**
     * Makes tooltip ~*disappear*~, if not being hovered over currently.
     * Can force to disappear evenwhen hovering by passing the parameter force.
     */
    unfocus(delayMs: number = 0, interrupt?: boolean): void {

        if (interrupt) this.anchor?.interrupt(TooltipTransitions.focus);

        this.anchor?.transition(TooltipTransitions.unfocus)
                    .delay(delayMs)
                    .attr(SVGAttrs.display, TooltipCSS.DISPLAY_HIDE);

    }

    /**
     * Assigns context to the tooltip. This selection will dictate what kinds of transforms
     * will be used to correct the tooltip's position.
     * @param selection
     */
    setContext(selection: AnySelection): void {
        this.context = selection;
    }

    /* Rectangle method Overrides */

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
            .attr(SVGAttrs.display, TooltipCSS.DISPLAY_HIDE)
            .on("mouseenter", () => {
                // prevent tooltip from losing focus when hovering
                this.anchor?.interrupt("unfocus");

            })
            .on("mouseleave", () => {
                // unfocus automatically on leave
                this.unfocus(450, true);
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

        s?.transition(TooltipTransitions.refresh).delay(this.delayRefresh)
            .attr(SVGAttrs.display, this.enabled ? TooltipCSS.DISPLAY_SHOW : TooltipCSS.DISPLAY_HIDE)

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

export class GenericAction {
    public readonly key: string;
    public readonly name: string;
    public readonly apply: (param: any) => any;

    constructor(key: string, name: string, apply: (param: any) => any) {
        this.key = key;
        this.name = name;
        this.apply = apply;
    }
}


export class TargetAction<Target> extends GenericAction {

    public readonly apply: (t: Target) => void;
    public depiction: SimpleDepiction = TargetAction.depiction.neutral;

    constructor(key: string, name: string, fn: (t: Target) => void) {
        super(key, name, fn);
        this.apply = fn;
    };

    // default kinds of action depictions
    public static depiction = {
        main: new SimpleDepiction(defaultColors.primary),
        delete: new SimpleDepiction(defaultColors.error),
        neutral: new SimpleDepiction(defaultColors.neutral)
    }

}

// shorthand the constructor
export function action<Target>(key: string, name: string, fn: (t: Target) => void): TargetAction<Target> { return new TargetAction(key, name, fn) }
