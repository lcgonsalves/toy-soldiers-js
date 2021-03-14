import Rectangle from "../../lib/geometry/Rectangle";
import {Coordinate, ICoordinate} from "../../lib/geometry/Coordinate";
import * as assert from "assert";
import {LocationContext} from "../../lib/mechanics/Location";
import LocationNode from "../../lib/graph/LocationNode";
import {Context, Done} from "mocha";

describe("Rectangles", function () {

    function compareCoords(a: ICoordinate, b: ICoordinate, aName: string = "A", bName: string = "B"): void {
        assert.strictEqual(a.equals(b), true, `Coordinate ${aName}: ${a.toString()} should be equal to Coordinate }${bName}: ${b.toString()}.`);
    }

    it("should instantiate correctly all parameters", function () {

        /**
         * Square defined like
         *
         *  (0, 0) ---------- (2, 0)
         *
         *    |        |         |
         *    |        |         |
         *    |  --  (1, 1)  --  |
         *    |        |         |
         *    |        |         |
         *
         *  (0, 2) ---------- (2, 2)
         *
         *
         */
        const square = Rectangle.fromCorners(Coordinate.origin, new Coordinate(2,2));

        // check that passed values match
        compareCoords(square.topLeft, Coordinate.origin, "top left", "origin");
        compareCoords(square.bottomRight, new Coordinate(2,2), "bottom right");


        // check that derived values are not nonsense
        compareCoords(square.bottomLeft, new Coordinate(0, 2), "bottom left");
        compareCoords(square.topRight, new Coordinate(2, 0), "top right");

        // verify lengths
        assert.strictEqual(square.length.x, 2, `length X ${square.length.x} should be 2`);
        assert.strictEqual(square.length.y, 2, `length Y ${square.length.y} should be 2`);

    });

    it("should translate in 1 dimension with no issues", function () {

        /**
         * Square defined like
         *
         *  (0, 0) ---------- (2, 0)
         *
         *    |        |         |
         *    |        |         |
         *    |  --  (1, 1)  --  |
         *    |        |         |
         *    |        |         |
         *
         *  (0, 2) ---------- (2, 2)
         *
         *
         */
        const square = Rectangle.fromCorners(Coordinate.origin, new Coordinate(2,2));

        // first we translate the whole thing sideways 1 step
        square.translateBy(1, 0);

        compareCoords(square.topLeft, new Coordinate(1, 0), "top left");
        compareCoords(square.topRight, new Coordinate(3, 0), "top right");
        compareCoords(square.bottomLeft, new Coordinate(1, 2), "bottom left");
        compareCoords(square.bottomRight, new Coordinate(3, 2), "bottom right");

    });

    it("should translate in both dimensions successfully", function () {

        /**
         * Square defined like
         *
         *  (0, 0) ---------- (2, 0)
         *
         *    |        |         |
         *    |        |         |
         *    |  --  (1, 1)  --  |
         *    |        |         |
         *    |        |         |
         *
         *  (0, 2) ---------- (2, 2)
         *
         *
         */
        const square = Rectangle.fromCorners(Coordinate.origin, new Coordinate(2,2));

        const squareMovedToCorner = square.copy.translateToCoord(new Coordinate(2, 2));

        compareCoords(squareMovedToCorner.topLeft, new Coordinate(1, 1), "top left");
        compareCoords(squareMovedToCorner.topRight, new Coordinate(3, 1), "top right");
        compareCoords(squareMovedToCorner.bottomLeft, new Coordinate(1, 3), "bottom left");
        compareCoords(squareMovedToCorner.bottomRight, new Coordinate(3, 3), "bottom right");

        const squareInNegativeCoords = square.copy.translateToCoord(Coordinate.origin);

        compareCoords(squareInNegativeCoords.topLeft, new Coordinate(-1, -1), "top left");
        compareCoords(squareInNegativeCoords.topRight, new Coordinate(1, -1), "top right");
        compareCoords(squareInNegativeCoords.bottomLeft, new Coordinate(-1, 1), "bottom left");
        compareCoords(squareInNegativeCoords.bottomRight, new Coordinate(1, 1), "bottom right");


    });

    it("should determine whether points are inside or outside rectangle", function () {

        function randomNumberInRange(low, high) {
            return low + (Math.random() * (high - low));
        }

        /**
         * Square defined like
         *
         *  (-1, -1) --------- (1, -1)
         *
         *    |        |         |
         *    |        |         |
         *    |  --  (0, 0)  --  |
         *    |        |         |
         *    |        |         |
         *
         *  (-1, 1) ---------- (1, 1)
         *
         *
         */
        const square = Rectangle.fromCorners(Coordinate.origin, new Coordinate(2,2)).translateToCoord(Coordinate.origin);

        const shouldBeInside: ICoordinate[] = [
            // corners
            new Coordinate(-1, -1),
            new Coordinate(1, -1),
            new Coordinate(-1, 1),
            new Coordinate(1, 1),
            // inside
            Coordinate.origin
        ];

        for (let i = 0; i < 1000; i++) shouldBeInside.push(new Coordinate(randomNumberInRange(-1, 1), randomNumberInRange(-1, 1)));

        shouldBeInside.forEach(coord => {
            assert.strictEqual(
                square.overlaps(coord),
                true,
                `Coordinate at ${coord.toString()} should overlap.`
            );
        });

        const shouldBeOutside: ICoordinate[] = [];

        for (let i = 0; i < 1000; i++) {

            // below bottom and to the right of right side
            shouldBeOutside.push(
                new Coordinate(
                    randomNumberInRange(1.0000000001, Number.POSITIVE_INFINITY),
                    randomNumberInRange(1.0000000001, Number.POSITIVE_INFINITY)
                )
            );

            // above top and to the left of left side
            shouldBeOutside.push(
                new Coordinate(
                    randomNumberInRange(-1.000000001, Number.NEGATIVE_INFINITY),
                    randomNumberInRange(-1.000000001, Number.NEGATIVE_INFINITY)
                )
            );

        }

        shouldBeOutside.forEach(coord => {
            assert.strictEqual(
                square.overlaps(coord),
                false,
                `Coordinate at ${coord.toString()} should NOT overlap.`
            );
        });

    });

    const positionBeforeSnap = new LocationNode("pre");

    function testPoints<N extends LocationNode>(ctx: LocationContext<N>, unacceptableCoordinates: N[], distance?: number) {
        // can't overlap any of the noes

        const snapped = ctx.snap(positionBeforeSnap.copy);

        // snapped coordinate should not be one of the nodes
        assert.strictEqual(unacceptableCoordinates.filter(_ => _.equals(snapped)).length, 0, `Guess ${snapped} should not overlap with current nodes.`);

        // check that there are no coordinates within the domain that could be closer to original coordinate
        const possibleCandidates = ctx.domain.x
            .flatMap(x => ctx.domain.y.map(y => new Coordinate(x, y)))
            .filter(candidate => unacceptableCoordinates.findIndex(unacceptable => unacceptable.overlaps(candidate)) === -1);

        const acceptableCandidates = possibleCandidates.filter(candidate => (candidate.distance(positionBeforeSnap) < snapped.distance(positionBeforeSnap)));

        acceptableCandidates.sort((a,b) => a.distance(positionBeforeSnap) - b.distance(positionBeforeSnap)).forEach(c => console.log(`Possible candidate ${c} has distance of ${c.distance(positionBeforeSnap)}`));
        if (distance)
            assert.strictEqual(
                Math.round(snapped.distance(positionBeforeSnap)), distance
            );

        assert.strictEqual(acceptableCandidates.length, 0, `There should be no better guesses than ${snapped}, but we found ${acceptableCandidates}`);
    }

    function highComplexityCase(margin: number): (this: Context, done: Done) => void {
        return function () {

            // simple context, step of 1
            const ctx = new LocationContext(1);

            const exceptionID = "TEST_ID";

            // adjust timeout because there's A LOT of nodes in this graph now!
            this.timeout(margin * 1000)

            // add nodes such that the first square is completely filled
            for (let x = ctx.domain.x.min + margin, i = 1; x <= (ctx.domain.x.max - margin); x += ctx.domain.x.step) {
                for (let y = ctx.domain.y.min + margin; y <= (ctx.domain.y.max - margin); y += ctx.domain.y.step, i++) {
                    if (x === 5 && y === 5) ctx.add(new LocationNode(exceptionID));
                    else ctx.add(new LocationNode("location node " + i));
                }
            }

            testPoints(ctx, [...ctx.nodes.values()]);

            const exepNode = ctx.get(exceptionID);
            const distanceToNodeCloseBy = exepNode.distance(positionBeforeSnap);
            ctx.rm(exceptionID);

            testPoints(ctx, [...ctx.nodes.values()], Math.round(distanceToNodeCloseBy))

            console.log("\n");

        }
    }

    it("usage in location context snap function should work with simple case", function () {

        // simple context, step of 1
        const ctx = new LocationContext(1);
        const n = new LocationNode("node A");

        // add a node at (1, 1)
        ctx.add(n);

        testPoints(ctx, [n]);

        console.log("\n");

    });

    it("usage in location context snap function should work with medium complexity case", function () {

        // simple context, step of 1
        const ctx = new LocationContext(1);

        // add nodes such that the first square is completely filled
        ctx.add(new LocationNode("node top left"));
        ctx.add(new LocationNode("node top right"));
        ctx.add(new LocationNode("node bottom left"));
        ctx.add(new LocationNode("node bottom right"));


        // can't overlap any of the noes
        const unacceptableCoordinates: LocationNode[] = [...ctx.nodes.values()];

        testPoints(ctx, unacceptableCoordinates);

        console.log("\n");

    });

    // running with a margin of 90 to avoid tests taking forever
    it("usage with a high complexity case, with more nodes in vicinity.", highComplexityCase(90));

});