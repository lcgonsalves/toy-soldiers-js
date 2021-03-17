import WorldContext from "./WorldContext";
import LocationNode from "../graph/LocationNode";
import {Coordinate, ICoordinate} from "../geometry/Coordinate";
import Rectangle from "../geometry/Rectangle";
import Domain from "../geometry/Domain";
import {Interval} from "../geometry/Interval";

export class LocationContext<N extends LocationNode> extends WorldContext<N> {

    /**
     * Snaps to available unit on the grid by translating original coordinate to destination.
     *
     * Make a copy if you're intending to preserve the original value.
     *
     * @param coordinate
     */
    snap(coordinate: ICoordinate): ICoordinate {

        const errorMessage = "No available starting square for placement in the grid.";

        // make a copy
        const c = this.domain.snap(coordinate.simple);

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
                const top = new Coordinate(x, domain.y.min);
                const bottom = new Coordinate(x, domain.y.max);
                points.set(top.toString(), top);
                points.set(bottom.toString(), bottom);
            });
            domain.y.forEach(y => {
                const left = new Coordinate(domain.x.min, y);
                const right = new Coordinate(domain.x.max, y);
                points.set(left.toString(), left);
                points.set(right.toString(), right);
            });

            const pt = [...points.values()].sort((a, b) => a.distance(coordinate) - b.distance(coordinate));

            for (let i = 0; i < pt.length; i++) {
                const nodeAtPoint = this.getNodeAtPosition(pt[i]);

                if (!nodeAtPoint || nodeAtPoint.equals(coordinate)) return pt[i];
            }

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
            const finalCoord = findClosestAvailableCoordinateRec(startingSquare);
            return coordinate.translateToCoord(finalCoord);
        }

    }


}
