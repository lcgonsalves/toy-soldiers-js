import {AbstractShape} from "./ShapeUtil";
import {ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {SimpleDepiction} from "../../util/Depiction";
import {defaultDepictions} from "../../util/DrawHelpers";
import SVGTags from "../../util/SVGTags";
import {combineLatest, Observable, race, Subject} from "rxjs";
import {line, Line} from "d3-shape"
import {throttleTime} from "rxjs/operators";
import SVGAttrs from "../../util/SVGAttrs";

export class LineShape extends AbstractShape<SVGPathElement> {

    protected points: ICoordinate[];
    protected line: Line<ICoordinate> = line<ICoordinate>().x(d => d.x).y(d => d.y);

    /** Observable that is triggered for every */
    private readonly _$modifiedPoints: Subject<any>;

    /** Observable that emits every time the points in this line get set. */
    get $modifiedPoints(): Observable<any>{
        return this._$modifiedPoints;
    }

    constructor(
        points: ICoordinate[] = [],
        depiction: SimpleDepiction = defaultDepictions.noFill.grays.dark,
        copy?: boolean
    ) {
        super(SVGTags.SVGPathElement, depiction);

        // copy points just in case
        this.points = copy ? points.map(_ => _.copy) : points;

        this.translateToCoord(this.center);

        this._$modifiedPoints = new Subject();

        // react to position changes and update
        this.$positionChange.subscribe(c => {
            const {x, y} = this.center.distanceInComponents(c);
            this.points.forEach(_ => _.translateBy(x, y));
        });

        // subscribe to changes in any of the points's positions
        race(this.points.map(_ => _.$positionChange), this._$modifiedPoints)
            .pipe(throttleTime(15))
            .subscribe(() => {
                console.log("points changed or their position changed")
                this.refreshAttributes();
            });

    }

    duplicate(): this {
        // @ts-ignore
        return new this.LineShape(this.points, this.depiction, true);
    }

    refreshAttributes(): void {

        this.anchor?.datum<ICoordinate[]>(this.points)
            .attr(SVGAttrs.d, this.line);

    }

    /**
     * Updates points in line and emits to $modifiedPoints when done.
     * @param newPts
     */
    setPoints(...newPts: ICoordinate[]): void {
        this.points = newPts.map(_ => _.copy);
        this._$modifiedPoints.next();
    }

    get center(): ICoordinate {
        if (this.points.length === 0) throw new Error("Can't return center, there are no points in Line.");
        else return this.points[Math.floor(this.points.length / 2)];
    }

}
