/**
 * Specifications for the coordinate interface.
 * I have little free time, so these tests are definitely not exhaustive, just a sanity check.
 */
import {Coordinate, ICoordinate} from "../../lib/geometry/Coordinate";
import * as assert from "assert";

/** Shorthand for comparing different coordinate instances. */
export const coordEq = (a: ICoordinate, b: ICoordinate) => {
    assert.strictEqual(a.equals(b), true)
}

export const forAllPoints = (assertionCallback: (a: ICoordinate, b: ICoordinate) => void): void => {
    // test all combinations
    points.forEach(alpha => {
        points.forEach(beta => {
            assertionCallback(alpha, beta);
        });
    });
}

// POINTS DEFINED IN ORDER TO FORM A 3-4-5 PYTHAGOREAN TRIANGLE
const pointA: ICoordinate = new Coordinate(0, 0),
      pointB: ICoordinate = new Coordinate(3, 0),
      pointC: ICoordinate = new Coordinate(0, 4);


// translate all of them by -2, -2 to have some negatives in the mix
[pointA, pointB, pointC].forEach(p => p.translateBy(-2, -2));

const pointH: ICoordinate = new Coordinate(1 ,1),
      pointJ: ICoordinate = new Coordinate(1 ,5),
      pointK: ICoordinate = new Coordinate(5 ,1);

const points: ICoordinate[] = [pointA, pointB, pointC, pointJ, pointH, pointK];

// what the size of each side should be
const catetoAB = 3,
      catetoAC = 4,
      hipotenusa = 5;

describe("Distances", function () {

    it("distance from A to B is 3", function () {
        assert.strictEqual(pointA.distance(pointB), catetoAB);
    });
    it("distance from A to C is 4", function () {
        assert.strictEqual(pointA.distance(pointC), catetoAC);
    });
    it("distance from C to B is 5", function () {
        assert.strictEqual(pointB.distance(pointC), hipotenusa);
    });

});

describe("Midpoints", function () {

    it("midpoints found correspond to predetermined ones", function (){
        // midpoint between (-5, 0) => (5, 0) should be the origin
        coordEq(new Coordinate(-5, 0).midpoint(new Coordinate(5, 0)), Coordinate.origin);

        // same for (0, -5) => (0, 5)
        coordEq(new Coordinate(0, -5).midpoint(new Coordinate(0, 5)), Coordinate.origin);

        // midpoint between H, J should be (1, 3)
        coordEq(pointJ.midpoint(pointH), new Coordinate(1, 3));

    });
    it("midpoints should form length that is half of original", function () {

        forAllPoints((alpha, beta) => {
            const d = alpha.distance(beta);
            const distToM = alpha.midpoint(beta).distance(alpha);

            assert.strictEqual(distToM, d / 2, `Distance from ${alpha} to ${beta} is ${d}, and distance to M is ${distToM} should be ${d / 2}`);
        })

    });
    it("midpoints should work the same both ways", function () {

        forAllPoints((alpha, beta) => {
            coordEq(alpha.midpoint(beta), beta.midpoint(alpha));
        })

    });

});

describe("Translations", function () {

    // reset all translations
    afterEach(function () {

        pointA.translateToCoord(new Coordinate(0, 0));
        pointB.translateToCoord(new Coordinate(3, 0));
        pointC.translateToCoord(new Coordinate(0, 4));

        [pointA, pointB, pointC].forEach(p => p.translateBy(-2, -2));

    });

    it("should translate to predetermined points", function () {

        // translating origin by 5 on the x axis yields  (5, 0)
        coordEq(Coordinate.origin.translateBy(5, 0), new Coordinate(5, 0));

        // translating to given point... yields given point
        coordEq(pointA.translateTo(pointB.x, pointB.y), pointB);

        // same but using different function


    });
    it("should translate accurately", function () {

        // translating B -> C can be done by translating left (neg) on the X axis by the distance B -> A
        // and then translating up (pos) on the Y axis by the distance A -> C
        coordEq(
            pointB.translateBy(
                - pointB.distance(pointA),
                pointA.distance(pointC)
            ),
            pointC // result
        );


    });

});
