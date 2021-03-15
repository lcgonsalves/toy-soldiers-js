import {AbstractShape} from "./ShapeUtil";
import {C, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {SimpleDepiction} from "../../util/Depiction";
import {defaultDepictions} from "../../util/DrawHelpers";
import SVGTags from "../../util/SVGTags";
import {combineLatest, interval, Subject} from "rxjs";
import {line, Line} from "d3-shape"
import {throttleTime} from "rxjs/operators";
import SVGAttrs from "../../util/SVGAttrs";

export class LineShape extends AbstractShape<SVGPathElement> {

    protected points: ICoordinate[];
    protected line: Line<ICoordinate> = line<ICoordinate>().x(d => d.x).y(d => d.y);

    /** Observable that is triggered for every */
    protected $modifiedPoints: Subject<any>;

    constructor(
        points: ICoordinate[] = [],
        depiction: SimpleDepiction = defaultDepictions.noFill.grays.dark
    ) {
        super(SVGTags.SVGPathElement, depiction);

        // copy points just in case
        this.points = points.map(_ => _.copy);

        this.$modifiedPoints = new Subject();

        // subscribe to changes in any of the points's positions
        combineLatest(this.points.map(_ => _.$positionChange), this.$modifiedPoints)
            .pipe(throttleTime(15))
            .subscribe(() => this.refreshAttributes());

    }

    duplicate(): this {
        // @ts-ignore
        return new this.constructor(this.points.map(_ => _.copy), this.depiction);
    }

    refreshAttributes(): void {

        this.anchor?.datum<ICoordinate[]>(this.points)
            .attr(SVGAttrs.d, this.line);

    }

    translateToCoord(other: ICoordinate): ICoordinate {
        this.points.forEach(_ => _.translateToCoord(other));
        return other;
    }

    translateBy(x: number, y: number): ICoordinate {
        this.points.forEach(_ => _.translateBy(x, y));
        return C(x, y);
    }

    translateTo(x: number, y: number): ICoordinate {
        this.points.forEach(_ => _.translateTo(x, y));
        return C(x, y);
    }

    get center(): ICoordinate {
        if (this.points.length === 0) throw new Error("Can't return center, there are no points in Line.");
        else return this.points[Math.floor(this.points.length / 2)];
    }

}
