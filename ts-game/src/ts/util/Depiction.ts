import {ISerializable, SerializableObject, SObj} from "ts-shared/build/util/ISerializable";

export class SimpleDepiction implements ISerializable {
    
    public readonly fill: string;
    public readonly stroke: string;
    public readonly strokeWidth: number;

    constructor(fill: string = "none", stroke: string = "none", strokeWidth: number = 1) {
        this.fill = fill
        this.stroke = stroke
        this.strokeWidth = strokeWidth
    }

    /** Returns a string representing the instance of this object at the time of serialization */
    get serialize(): string {
        return this.simplified.toString();
    }

    get simplified(): SerializableObject {
        return SObj({
            fill: this.fill,
            stroke: this.stroke,
            strokeWidth: this.strokeWidth
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
        return new SimpleDepiction(this.fill, this.stroke, this.strokeWidth)
    }

}
