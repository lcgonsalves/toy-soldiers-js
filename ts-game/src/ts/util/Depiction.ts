import {ISerializable, SerializableObject, SObj} from "ts-shared/build/util/ISerializable";
import IComparable from "ts-shared/build/util/IComparable";

export class SimpleDepiction implements ISerializable, IComparable {

    public readonly fill: string;
    public readonly stroke: string;
    public readonly strokeWidth: number;
    public readonly opacity: number;
    public readonly clickable: boolean;
    public readonly hoverable: boolean;

    private _id: string = "";

    constructor(
        fill: string = "none",
        stroke: string = "none",
        strokeWidth: number = 1,
        opacity: number = 1,
        hoverable: boolean = false,
        clickable: boolean = false
    ) {
        this.fill = fill;
        this.stroke = stroke;
        this.strokeWidth = strokeWidth;
        this.opacity = opacity;
        this.clickable = clickable;
        this.hoverable = hoverable;
    }

    /** Returns a string representing the instance of this object at the time of serialization */
    get serialize(): string {
        return this.simplified.toString();
    }

    // two depictions with the same ID are considered equal.
    get id(): string {
        return this._id;
    }

    get simplified(): SerializableObject {
        return SObj({
            fill: this.fill,
            stroke: this.stroke,
            strokeWidth: this.strokeWidth,
            opacity: this.opacity,
            clickable: this.clickable,
            hoverable: this.hoverable
        });
    }

    /** @immutable */
    setFill(fill: string): SimpleDepiction {
        return new SimpleDepiction(fill, this.stroke, this.strokeWidth, this.opacity);
    }

    /** @immutable */
    setStroke(stroke: string): SimpleDepiction {
        return new SimpleDepiction(this.fill, stroke, this.strokeWidth, this.opacity);
    }

    /** @immutable */
    setStrokeWidth(strokeWidth: number): SimpleDepiction {
        return new SimpleDepiction(this.fill, this.stroke, strokeWidth, this.opacity)
    }

    /** @immutable */
    setClickable(val: boolean): SimpleDepiction {
        return new SimpleDepiction(this.fill, this.stroke, this.strokeWidth, this.opacity, this.hoverable, val);
    }

    /** @immutable */
    setHoverable(val: boolean): SimpleDepiction {
        return new SimpleDepiction(this.fill, this.stroke, this.strokeWidth, this.opacity, val, this.clickable)
    }

    /** @immutable */
    setOpacity(val: number): SimpleDepiction {
        return new SimpleDepiction(this.fill, this.stroke, this.strokeWidth, val, this.hoverable, this.clickable)
    }

    setID(id: string): SimpleDepiction {

        this._id = id;
        return this;

    }

    equals(other: IComparable): boolean {
        if (other instanceof SimpleDepiction) return (
            this.id == other.id ||
            (this.fill == other.fill &&
            this.stroke == other.stroke &&
            this.strokeWidth == other.strokeWidth &&
            this.opacity == other.opacity &&
            this.hoverable == other.hoverable &&
            this.clickable == other.clickable)
        );
        else return false;
    }

}
