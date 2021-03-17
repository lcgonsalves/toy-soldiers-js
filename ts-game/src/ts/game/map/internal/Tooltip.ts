import { path } from "d3";
import {
    AnySelection, defaultColors,
    defaultConfigurations,
    getTransforms,
    rect, renderIconForSelection,
    TooltipConfig
} from "../../../util/DrawHelpers";
import {IDepictable} from "../../units/UnitInterfaces";
import SVGTags from "../../../util/SVGTags";
import SVGAttrs from "../../../util/SVGAttrs";
import {C, Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import Rectangle from "ts-shared/build/geometry/Rectangle";
import {PayloadRectangle} from "ts-shared/build/geometry/Payload";
import {TargetAction} from "../../../util/Action";
import {SimpleDepiction} from "../../../util/Depiction";
import {Selection, BaseType} from "d3-selection";
import {Events} from "../../../util/Events";


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

    private readonly config: TooltipConfig;
    public anchor: AnySelection | undefined;
    private lastFocusTarget: ICoordinate | undefined;

    public enabled: boolean = true;

    public static buttonAnimationDuration: number = 250;

    public get currentlyDisplaying(): boolean {
        return this.anchor?.attr(SVGAttrs.display) === TooltipCSS.DISPLAY_SHOW;
    }

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

        // do not focus if there's no actions, not enabled
        if (
            !actions.length ||
            !this.enabled
        ) return;

        // interrupt unfocus if there was an unfocus action in place
        this.anchor?.interrupt(TooltipTransitions.unfocus);

        // save target
        this.lastFocusTarget = target;

        // undo contextual transforms
        const transforms = getTransforms(this.context);
        const untransformedTarget: ICoordinate = anchorPoint.copy.translateTo(
            (anchorPoint.x * transforms.scale) + transforms.translation.x,
            (anchorPoint.y * transforms.scale) + transforms.translation.y
        )

        this.translateToCoord(untransformedTarget);

        // display anchor
        if (this.currentlyDisplaying) this.anchor?.attr(SVGAttrs.display,TooltipCSS.DISPLAY_SHOW);
        else this.anchor?.transition(TooltipTransitions.focus).delay(delayMs).attr(SVGAttrs.display,TooltipCSS.DISPLAY_SHOW);

        this.setActions(actions, target, delayMs);

    }

    /**
     * Override the buttons to display a new set of actions to be performed on the current target of the focus. If no
     * actions are passed, tooltip hides.
     * @param actions
     * @param target
     * @param delayMs
     */
    public setActions<Target extends ICoordinate>(
        actions: TargetAction<Target>[],
        target: Target,
        delayMs: number
    ) {

        if (!actions.length) {
            this.unfocus();
        }

        const {
            topLeft,
            bottomLeft
        } = this;

        const {
            buttonMargin,
            buttonRadius,
            buttonDiameter
        } = this.config;

        const newWidth: number = buttonMargin + (actions.length * (buttonDiameter + buttonMargin));

        // set width to fit new params
        this.setWidth(newWidth);

        const mid = topLeft.midpoint(bottomLeft).translateBy(buttonMargin + buttonRadius, 0);
        const iconContainerSize = buttonDiameter * 0.45;

        let dataJoin: Selection<SVGGElement, PayloadRectangle<TargetAction<Target>>, BaseType, any> | undefined;

        dataJoin = this.anchor?.select("." + TooltipCSS.BUTTONS_CONTAINER_CLS)
            .selectAll<SVGGElement, PayloadRectangle<TargetAction<Target>>>("." + TooltipCSS.BUTTON_CLS)
            .data<PayloadRectangle<TargetAction<Target>>>(
                actions.map((_, index) => (
                    new PayloadRectangle(_, mid.copy.translateBy(index * (buttonDiameter + buttonMargin), 0), iconContainerSize, iconContainerSize)
                )),
                _ => _.payload.name
            );

        // initialize button group
        const btnG = dataJoin?.enter()
            .append<SVGGElement>(SVGTags.SVGGElement)
            .classed(TooltipCSS.BUTTON_CLS, true);

        // add new button circles
        btnG?.append(SVGTags.SVGCircleElement)
            .on(Events.click, function (evt: any, action: PayloadRectangle<TargetAction<Target>>) {
                action.payload.apply(target);
            })
            .on(Events.mouseenter, function (evt: any, action: PayloadRectangle<TargetAction<Target>>) {
                action.payload.preview(target);
            })
            .on(Events.mouseleave, function (evt: any, action: PayloadRectangle<TargetAction<Target>>) {
                action.payload.stopPreview(target);
            })
            .attr(SVGAttrs.cx, _ => _.x)
            .attr(SVGAttrs.cy, _ => _.y)
            .attr(SVGAttrs.r, buttonRadius / 1.2)
            .attr(SVGAttrs.fill, _ => _.payload.depiction.fill)
            .attr(SVGAttrs.stroke, _ => _.payload.depiction.stroke)
            .attr(SVGAttrs.strokeWidth, _ => _.payload.depiction.strokeWidth)
            .transition(TooltipTransitions.button_pop)
            .delay(this.currentlyDisplaying ? 0 : delayMs)
            .duration(ActionTooltip.buttonAnimationDuration)
            .attr(SVGAttrs.r, buttonRadius);

        // append icons where available, run this only on enter selection to avoid appending svg copies when not needed
        if (btnG) renderIconForSelection<TargetAction<Target>,
            PayloadRectangle<TargetAction<Target>>,
            SVGGElement>(btnG, d => d.key, new SimpleDepiction(defaultColors.grays.superextradark, "none", 1, 1));


        // remove old buttons
        dataJoin?.exit().remove();

        // update position and handler of buttons, in case the actions have changed since the last join.
        if (dataJoin) this.updateButtonDepiction(target, dataJoin, delayMs);

        // refresh to match width
        this.refresh();

    }

    snapSelf(): void {
        // no snapping if there's no focus target
        if (this.lastFocusTarget)
            this.translateToCoord(this.lastFocusTarget);
    }

    /**
     * Makes tooltip ~*disappear*~, if not being hovered over currently.
     * Can force to disappear evenwhen hovering by passing the parameter force.
     */
    unfocus(delayMs: number = 0, interrupt?: boolean): void {

        if (interrupt) this.anchor?.interrupt(TooltipTransitions.focus).interrupt(TooltipTransitions.button_pop);

        if (!delayMs) {
            this.anchor?.attr(SVGAttrs.display, TooltipCSS.DISPLAY_HIDE)
        } else {
            this.anchor?.transition(TooltipTransitions.unfocus)
                .delay(delayMs)
                .attr(SVGAttrs.display, TooltipCSS.DISPLAY_HIDE);
        }

    }

    /**
     * Updates depiction of the buttons in the tooltip based on the set of actions associated to said buttons.
     * @param target node towards which the tooltip should point to
     * @param dataJoin selection containing the data (not enter, not exit)
     * @param delayMs delay to run animation.
     * @private
     */
    private updateButtonDepiction<Target extends ICoordinate>(
        target: Target,
        dataJoin: Selection<SVGGElement, PayloadRectangle<TargetAction<Target>>, BaseType, any>,
        delayMs: number
    ) {

        const {
            topLeft,
            bottomLeft,
        } = this;

        const {
            buttonMargin,
            buttonRadius
        } = this.config;

        const currentlyDisplaying = this.anchor?.attr(SVGAttrs.display) === TooltipCSS.DISPLAY_SHOW;

        const mid = topLeft.midpoint(bottomLeft).translateBy(buttonMargin + buttonRadius, 0);

        dataJoin.select(SVGTags.SVGCircleElement)
            .attr(SVGAttrs.cx, _ => _.x)
            .attr(SVGAttrs.cy, mid.y)
            .attr(SVGAttrs.r, buttonRadius / 1.2)
            .on("click", function (evt: any, action: PayloadRectangle<TargetAction<Target>>) {
                action.payload.apply(target);
            })
            .attr(SVGAttrs.fill, _ => _.payload.depiction.fill)
            .attr(SVGAttrs.stroke, _ => _.payload.depiction.stroke)
            .attr(SVGAttrs.strokeWidth, _ => _.payload.depiction.strokeWidth)
            .transition(TooltipTransitions.button_pop)
            .delay(
                // no delay if this is the same object
                currentlyDisplaying &&
                (this.lastFocusTarget && this.lastFocusTarget.equals(target)) ?
                    0 :
                    delayMs
            )
            .duration(ActionTooltip.buttonAnimationDuration)
            .attr(SVGAttrs.r, buttonRadius);


        // update position of icon too
        dataJoin?.select(SVGTags.SVGSVGElement)
            .attr(SVGAttrs.x, _ => _.topLeft.x)
            .attr(SVGAttrs.y, _ => _.topLeft.y);


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

    delete() {
        this.deleteDepiction();
    }

    refresh(): void {

        const s = this.anchor;

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

    /**
     * Removes button element associated to action key
     * @param actionKey
     */
    removeAction(actionKey: string) {

        if (this.anchor) {

            const {
                topLeft,
                bottomLeft,
            } = this;

            const {
                buttonMargin,
                buttonRadius
            } = this.config;

            const buttonDiameter = 2 * buttonRadius;

            const s = this.anchor.selectAll<SVGGElement, PayloadRectangle<TargetAction<any>>>("." + TooltipCSS.BUTTON_CLS);
            const remBtns = s.data().filter(x => x.payload.key !== actionKey);

            const dataJoin = s.data(remBtns);

            // update remaining buttons position, data join for removal and pass the join to update.
            dataJoin.exit().remove();

            // set width to fit new params
            const newWidth: number = buttonMargin + ((remBtns.length) * (buttonDiameter + buttonMargin));
            this.setWidth(newWidth);

            const mid = topLeft.midpoint(bottomLeft).translateBy(buttonMargin + buttonRadius, 0);

            remBtns.forEach((btn, i) => {

                btn.translateToCoord(mid.copy.translateBy(i * (buttonDiameter + buttonMargin), 0));

            });

            // if new width is zero, hide
            if (remBtns.length === 0) {
                this.unfocus();
                return;
            }

            this.refresh();
            this.updateButtonDepiction(this.lastFocusTarget ?? Coordinate.origin, dataJoin, 0);


        }

    }

}
