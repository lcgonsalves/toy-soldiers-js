import {C, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import Rectangle from "ts-shared/build/geometry/Rectangle";
import {GenericConstructor} from "ts-shared/build/util/MixinUtil";
import {IDepictable} from "./UnitInterfaces";
import SVGAttrs from "../../util/SVGAttrs";

/**
 * Describes methods to be implement by Scalable units. These allow an object to change its size
 * to fit different containers.
 */
export interface IScalable {

    /** The scale factor of this object. If it's set to 1, the object is unscaled. If set to <1 the object is
     * scaled down, >1 the object is scaled up */
    readonly scale: number;

    /** Returns the position of this object, with the scale transform removed */
    readonly unscaledPosition: ICoordinate;

    /** Translates to a given coordinate, but scaled to the size of this unit. */
    translateToScaledCoord(other: ICoordinate): this;

    /** translates by a value {x, y} by an equivalent amount, based on this game unit's scale */
    translateByScaled(x: number, y: number): this;

    /**
     * Applies transforms to this elements such that it best fits the bounds.
     * @param bounds
     */
    scaleToFit(bounds: Rectangle): this;

    /** Resets scale of this object (sets it to 1), and translates it to original unscaled position. */
    resetScale(): this;

}

/**
 * @mixin
 *
 * Injects scalable behavior and expands class Base to have the hability to scale to fit bounds.
 * @param Base
 * @constructor
 */
function ScalableUnit<T extends GenericConstructor<IDepictable & ICoordinate>>(Base: T) {
    return class Scalable extends Base implements IScalable {

        private _scale: number = 1;

        get scale(): number { return this._scale };
        get unscaledPosition(): ICoordinate { return this.copy.translateTo(this.x * this.scale, this.y * this.scale) };

        resetScale(): this {
            this.translateToCoord(this.unscaledPosition);
            this._scale = 1;
            return this;
        }

        scaleToFit(bounds: Rectangle): this {

            const container = this.anchor?.node() as SVGGElement;

            if (this.anchor && container) {

                const bbox = container.getBBox();

                // 30% padding to give the container some breathing room
                const padding = 0.3;
                const paddedBounds = bounds.copy.setWidth(bounds.width * (1-padding)).setHeight(bounds.height * (1-padding));

                const currentBounds = bbox;
                const xRatio = paddedBounds.width / currentBounds.width;
                const yRatio = paddedBounds.height / currentBounds.height;

                const ratio = Math.min(xRatio, yRatio);
                this._scale = ratio;

                this.anchor.attr(SVGAttrs.transform, `scale(${ratio})`);

                // update position to reverse scaling
                this.translateToScaledCoord(this);

            } else console.warn(`Unable to scale element. Anchor (${this.anchor}) or Container (${container}) are falsy.`);

            return this;

        }

        translateByScaled(x: number, y: number): this {
            this.translateBy(x / this.scale, y / this.scale);
            return this;
        }

        translateToScaledCoord(other: ICoordinate): this {
            this.translateToCoord(C(other.x / this.scale, other.y / this.scale));
            return this;
        }


    }
}
