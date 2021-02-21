import {Coordinate, ICoordinate} from "./Coordinate";
import {Interval} from "./Interval";
import Domain from "./Domain";

/**
 * Defines a rectangle. Does not support rotations.
 */
export default class Rectangle extends Coordinate {
    private readonly _topLeft: ICoordinate;
    private readonly _bottomLeft: ICoordinate;
    private readonly _topRight: ICoordinate;
    private readonly _bottomRight: ICoordinate;
    // length divided in two parameters: x and y
    private readonly _length: {
        x: number,
        y: number
    };

    get topLeft(): ICoordinate {
        return this._topLeft;
    }

    get bottomLeft(): ICoordinate {
        return this._bottomLeft;
    }

    get topRight(): ICoordinate {
        return this._topRight;
    }

    get bottomRight(): ICoordinate {
        return this._bottomRight;
    }

    get length(): { x: number; y: number } {
        return this._length;
    }

    get width(): number { return this.length.x }
    get height(): number { return this.length.y }


    constructor(topLeft: ICoordinate, topRight: ICoordinate, bottomLeft: ICoordinate, bottomRight: ICoordinate) {

        // center coordinate
        super(topLeft.x + topLeft.distance(topRight) / 2, topLeft.y + topLeft.distance(bottomLeft) / 2);

        this._topLeft = topLeft.copy;
        this._topRight = topRight.copy;
        this._bottomRight = bottomRight.copy;
        this._bottomLeft = bottomLeft.copy;
        this._length = {
            x: topLeft.distance(topRight),
            y: topLeft.distance(bottomLeft)
        };

    }

    public static fromCorners(topLeft: ICoordinate, bottomRight: ICoordinate): Rectangle {

        const dic = topLeft.distanceInComponents(bottomRight);

        const topRight = topLeft.copy.translateBy(dic.x, 0);
        const bottomLeft = bottomRight.copy.translateBy(-dic.x, 0);

        return new Rectangle(topLeft, topRight, bottomLeft, bottomRight);

    }

    get copy(): Rectangle {
        return new Rectangle(this._topLeft, this._topRight, this._bottomLeft, this._bottomRight);
    }

    equals(other: ICoordinate): boolean {
        if (!(other instanceof Rectangle)) return false;

        return other._bottomRight.equals(this._bottomRight) &&
            other._bottomLeft.equals(this._bottomLeft) &&
            other._topRight.equals(this._topRight) &&
            other._topLeft.equals(this._topLeft);
    }

    translateTo(x: number, y: number): Rectangle {
        const dic = this.distanceInComponents(new Coordinate(x,y));
        this.translateBy(dic.x, dic.y);

        return this;
    }

    translateToCoord(other: ICoordinate): Rectangle {
        super.translateToCoord(other);
        return this;
    }

    translateBy(x: number, y: number): Rectangle {
        super.translateBy(x, y);

        // translate each unit by the components
        [this._topRight, this._topLeft, this._bottomLeft, this._bottomRight].forEach(point => {

            point.translateBy(x, y);

        });

        return this;
    }

    overlaps(other: ICoordinate): boolean {
        // return true if right smack in the middle of it
        if (super.overlaps(other)) return true;

        // X ranges from left.x to right.x, inclusive
        // Y ranges from top.y to bottom.y
        const d = new Domain(
            new Interval(this.topLeft.x, this.topRight.x),
            new Interval(this.topLeft.y, this.bottomLeft.y)
        );

        return d.contains(other);
    }

}

/**
 * Returns a simple square, with top left corner at origin.
 * @param size
 */
export function Square(size: number): Rectangle {
    return Rectangle.fromCorners(Coordinate.origin, Coordinate.origin.translateBy(size, size));
}
