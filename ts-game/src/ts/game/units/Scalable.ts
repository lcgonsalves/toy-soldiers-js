import {C, ICoordinate, IMovable} from "ts-shared/build/geometry/Coordinate";
import Rectangle from "ts-shared/build/geometry/Rectangle";
import {GenericConstructor} from "ts-shared/build/util/MixinUtil";
import {IDepictable, IDepictableWithSprite} from "./UnitInterfaces";
import SVGAttrs from "../../util/SVGAttrs";
import {AnySelection, getTransforms} from "../../util/DrawHelpers";

/**
 * Describes methods to be implement by Scalable units. These allow an object to change its size
 * to fit different containers.
 */
export interface IScalable {

    /** The scale factor of this object. If it's set to 1, the object is unscaled. If set to <1 the object is
     * scaled down, >1 the object is scaled up */
    readonly scale: number;

    /** Returns the position of this object, with the scale transform removed, and with the transforms of the selection applied. */
    unscaledPosition(selection?: AnySelection): ICoordinate;

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
 * Injects scalable behavior and expands class Base to have the hability to scale to fit bounds. Default translation method
 * now takes into account transforms on this Unit.
 *
 * @param Base
 * @constructor
 */
export function ScalableUnit<
    Element extends SVGGElement,
    T extends GenericConstructor<IDepictableWithSprite<Element> & ICoordinate>>(Base: T) {
    return class Scalable extends Base implements IScalable, IMovable {

        private _scale: number = 1;

        get scale(): number { return this._scale };


        unscaledPosition(selection?: AnySelection): ICoordinate {

            // reverse transforms to place node in correct coordinate
            const {
                translation,
                scale
            } = getTransforms(selection);

            // undo current transforms
            const reversed = C(this.x, this.y).translateTo(this.x * this.scale, this.y * this.scale);

            // apply selection's transforms
            reversed.translateTo(
                ((reversed.x / scale) - (translation.x / scale)),
                ((reversed.y / scale) - (translation.y / scale))
            );

            return reversed;
        };

        resetScale(): this {
            this.setPosition(this.unscaledPosition());
            this._scale = 1;
            return this;
        }

        scaleToFit(bounds: Rectangle): this {

            const container = this.anchor?.node() as SVGGElement;

            if (this.anchor && container) {

                const bbox = container.getBBox();

                // 30% padding to give the container some breathing room
                const padding = 0.3;
                const maxIncrease = 1.35;
                const paddedBounds = bounds.copy.setWidth(bounds.width * (1-padding)).setHeight(bounds.height * (1-padding));

                const currentBounds = bbox;
                const xRatio = paddedBounds.width / currentBounds.width;
                const yRatio = paddedBounds.height / currentBounds.height;

                const ratio = Math.min(xRatio, yRatio, maxIncrease);
                this._scale = ratio;

                this.anchor.attr(SVGAttrs.transform, `scale(${ratio})`);

                // update position to reverse scaling
                this.translateToScaledCoord(this);


            } else console.warn(`Unable to scale element. Anchor (${this.anchor}) or Container (${container}) are falsy.`);

            return this;

        }

        translateByScaled(x: number, y: number): this {
            super.translateBy(x / this.scale, y / this.scale);
            return this;
        }

        translateToScaledCoord(other: ICoordinate): this {
            super.translateToCoord(C(other.x / this.scale, other.y / this.scale));
            return this;
        }

        translateBy(x: number, y: number): ICoordinate {
            return this.translateByScaled(x, y);
        }

        translateTo(x: number, y: number): ICoordinate {
            return this.translateToScaledCoord(C(x, y));
        }

        translateToCoord(other: ICoordinate): ICoordinate {
            return this.translateToScaledCoord(other);
        }

    }
}
