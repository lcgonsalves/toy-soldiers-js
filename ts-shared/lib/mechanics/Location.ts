import WorldContext from "./WorldContext";
import LocationNode from "../graph/LocationNode";
import {Coordinate, ICoordinate} from "../geometry/Coordinate";
import Rectangle from "../geometry/Rectangle";
import Domain from "../geometry/Domain";
import {Interval} from "../geometry/Interval";

export class LocationContext<N extends LocationNode> extends WorldContext<N> {

    // all nodes in the location context must be associated with said context
    add(...n: N[]): LocationContext<N> {
        super.add(...n);
        n.forEach(_ => _.associate(this));
        return this;
    }

    /**
     * Snaps to available unit on the grid by translating original coordinate to destination.
     *
     * Make a copy if you're intending to preserve the original value.
     *
     * @param coordinate
     */
    snap(coordinate: ICoordinate): ICoordinate {

        const errorMessage = "Somehow I fucked up the math. If you see this error, you fucked up the math. Go fix the code";
        const hardCapOnSizeOfGuesses = 4;

        // make a copy
        const c = this.domain.snap(coordinate.copy);

        // if this one works, yeet. no need to proceed further
        if (!this.containsNodeAtLocation(c)) return coordinate.translateToCoord(c);

        const xStep = this.domain.x.step;
        const yStep = this.domain.y.step;

        /**
         * 4 Squares meeting at C (snapped coord) defined like:
         *
         *    xStep length
         *    .....^....
         *  (topL) ---------- (topR)
         *
         *    |        |         |
         *    |        |         |
         *    |  --   (c)    --  | _
         *    |        |         |  |
         *    |        |         | _| -> yStep length
         *
         * (bottomL) ------- (bottomR)
         *
         *
         */
        const topL = Rectangle.fromCorners(c.copy.translateBy(-xStep, -yStep), c);
        const topR = topL.copy.translateBy(xStep, 0);
        const bottomL = topL.copy.translateBy(0, yStep);
        const bottomR = bottomL.copy.translateBy(xStep, 0);

        const findClosestAvailableCoordinate = (square: Rectangle): ICoordinate | undefined => {

            // all available points in the square are defined within the following domain
            const domain = new Domain(
                new Interval(square.topLeft.x, square.topRight.x, this.domain.x.step),
                new Interval(square.topLeft.y, square.bottomLeft.y, this.domain.y.step)
            );

            const points: Map<string, ICoordinate> = new Map<string, ICoordinate>();

            // since this function is only called after the call on the previous depth failed, we can skip the inner squares
            // i.e. we just check the outer points on the square
            domain.x.forEach(x => {
                points.set(`[${x}, ${domain.y.min}]`, new Coordinate(x, domain.y.min))
                points.set(`[${x}, ${domain.y.max}]`, new Coordinate(x, domain.y.max))
            });
            domain.y.forEach(y => {
                points.set(`[${domain.x.min}, ${y}]`, new Coordinate(domain.x.min, y))
                points.set(`[${domain.x.max}, ${y}]`, new Coordinate(domain.x.max, y))
            });

            const pt = [...points.values()].sort((a, b) => a.distance(coordinate) - b.distance(coordinate));

            for (let i = 0; i < pt.length; i++) if (!this.containsNodeAtLocation(pt[i])) return pt[i];
            // if all are occupied, return undefined
            return undefined;

        }

        const findClosestAvailableCoordinateRec = (square: Rectangle): ICoordinate | undefined => {

            const coord = findClosestAvailableCoordinate(square);

            if (!coord) {
                const expandedSquare = Rectangle.fromCorners(
                    square.topLeft.copy.translateBy(-xStep, -yStep),
                    square.bottomRight.copy.translateBy(xStep, yStep)
                );

                return findClosestAvailableCoordinateRec(expandedSquare);

            } else return coord;

        }

        const startingSquare = [topL, topR, bottomL, bottomR].find(_ => _.overlaps(coordinate));

        // somehow none of the starting squares contains the original coord...
        if (!startingSquare) throw new Error(errorMessage);
        else {
            return findClosestAvailableCoordinateRec(startingSquare);
        }

    }


}
