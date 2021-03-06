import {Coordinate, ICoordinate} from "./Coordinate";
import {Interval} from "./Interval";
import Domain from "./Domain";

export enum RectangleCorners {
    TOP_LEFT,
    TOP_RIGHT,
    BOTTOM_LEFT,
    BOTTOM_RIGHT,
    CENTER
}

/**
 * Defines a rectangle. Does not support rotations.
 */
export default class Rectangle extends Coordinate {
    private readonly _topLeft: ICoordinate;
    private readonly _bottomLeft: ICoordinate;
    private readonly _topRight: ICoordinate;
    private readonly _bottomRight: ICoordinate;

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
        return {
            x: this.width,
            y: this.height
        }
    }

    get width(): number { return this.topLeft.distance(this.topRight) }
    get height(): number { return this.topLeft.distance(this.bottomLeft) }

    constructor(topLeft: ICoordinate, topRight: ICoordinate, bottomLeft: ICoordinate, bottomRight: ICoordinate) {

        // center coordinate
        super(topLeft.x + topLeft.distance(topRight) / 2, topLeft.y + topLeft.distance(bottomLeft) / 2);

        this._topLeft = topLeft.copy;
        this._topRight = topRight.copy;
        this._bottomRight = bottomRight.copy;
        this._bottomLeft = bottomLeft.copy;

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

    toString(): string {
        return `R (${this.topLeft.toString()}, ${this.topRight.toString()}, ${this.bottomLeft.toString()}, ${this.bottomRight.toString()} )`
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

    /** Sets new width, shrinking/expanding from a given anchor point, defaulting in the center */
    setWidth(newWidth: number, anchorPoint: RectangleCorners = RectangleCorners.CENTER): this {
        const {
            CENTER,
            TOP_LEFT,
            TOP_RIGHT,
            BOTTOM_LEFT,
            BOTTOM_RIGHT
        } = RectangleCorners;

        const {
            topLeft,
            topRight,
            bottomLeft,
            bottomRight
        } = this;

        // positive if expanding, negative if shrink
        const amountToExpand = newWidth - this.width;

        switch(anchorPoint) {
            // expand points equally away from center, half of the difference
            case CENTER:
                topLeft.translateBy(-(amountToExpand / 2), 0);
                topRight.translateBy(amountToExpand / 2, 0);
                bottomLeft.translateBy(-(amountToExpand / 2), 0);
                bottomRight.translateBy(amountToExpand / 2, 0);
                break;
            
            case TOP_LEFT:
            case BOTTOM_LEFT:
                topRight.translateBy(amountToExpand, 0);
                bottomRight.translateBy(amountToExpand, 0);
                break;

            case TOP_RIGHT:
            case BOTTOM_RIGHT:
                topLeft.translateBy(-amountToExpand, 0);
                bottomLeft.translateBy(-amountToExpand, 0);
                break;
            
            default:
                throw new Error("Invalid anchor point.");
        }
        return this;
    }

    /** Sets new width, shrinking/expanding from a given anchor point, defaulting in the center */
    setHeight(newHeight: number, anchorPoint: RectangleCorners = RectangleCorners.CENTER): this {
        const {
            CENTER,
            TOP_LEFT,
            TOP_RIGHT,
            BOTTOM_LEFT,
            BOTTOM_RIGHT
        } = RectangleCorners;

        const {
            topLeft,
            topRight,
            bottomLeft,
            bottomRight
        } = this;

        // positive if expanding, negative if shrink
        const amountToExpand = newHeight - this.width;

        switch(anchorPoint) {
            // expand points equally away from center, half of the difference
            case CENTER:
                topLeft.translateBy(0, -(amountToExpand / 2));
                topRight.translateBy(0, -(amountToExpand / 2));
                bottomLeft.translateBy(0, amountToExpand / 2);
                bottomRight.translateBy(0, amountToExpand / 2);
                break;

            case BOTTOM_RIGHT:
            case BOTTOM_LEFT:
                topRight.translateBy(-amountToExpand, 0);
                topLeft.translateBy(-amountToExpand, 0);
                break;

            case TOP_RIGHT:
            case TOP_LEFT:
                bottomRight.translateBy(amountToExpand, 0);
                bottomLeft.translateBy(amountToExpand, 0);
                break;

            default:
                throw new Error("Invalid anchor point.");
        }
        return this;
    }

}

/**
 * Returns a simple square, with center at origin.
 * @param size
 */
export function Square(size: number): Rectangle {
    return Rectangle.fromCorners(Coordinate.origin.translateBy(-size / 2, -size / 2), Coordinate.origin.translateBy(size / 2, size / 2));
}
