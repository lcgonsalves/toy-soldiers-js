import {ISerializable, SerializableObject, SObj} from "ts-shared/build/util/ISerializable";

export class SimpleDepiction implements ISerializable {
    
    public readonly fill: string;
    public readonly stroke: string;
    public readonly strokeWidth: number;
    public readonly clickable: boolean;
    public readonly hoverable: boolean;

    constructor(
        fill: string = "none",
        stroke: string = "none",
        strokeWidth: number = 1,
        clickable: boolean = false,
        hoverable: boolean = false
    ) {
        this.fill = fill
        this.stroke = stroke
        this.strokeWidth = strokeWidth
        this.clickable = clickable;
        this.hoverable = hoverable;
    }

    /** Returns a string representing the instance of this object at the time of serialization */
    get serialize(): string {
        return this.simplified.toString();
    }

    get simplified(): SerializableObject {
        return SObj({
            fill: this.fill,
            stroke: this.stroke,
            strokeWidth: this.strokeWidth,
            clickable: this.clickable,
            hoverable: this.hoverable
        });
    }

    /** @immutable */
    setFill(fill: string): SimpleDepiction {
        return new SimpleDepiction(fill, this.stroke, this.strokeWidth);
    }

    /** @immutable */
    setStroke(stroke: string): SimpleDepiction {
        return new SimpleDepiction(this.fill, stroke, this.strokeWidth);
    }

    /** @immutable */
    setStrokeWidth(strokeWidth: number): SimpleDepiction {
        return new SimpleDepiction(this.fill, this.stroke, strokeWidth)
    }

    /** @immutable */
    setClickable(val: boolean): SimpleDepiction {
        return new SimpleDepiction(this.fill, this.stroke, this.strokeWidth, val, this.hoverable);
    }

    /** @immutable */
    setHoverable(val: boolean): SimpleDepiction {
        return new SimpleDepiction(this.fill, this.stroke, this.strokeWidth, this.clickable, val)
    }

}
