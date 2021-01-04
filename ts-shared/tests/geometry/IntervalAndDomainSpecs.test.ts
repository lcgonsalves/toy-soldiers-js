import {Interval} from "../../lib/geometry/Interval";
import * as assert from "assert";
import {Coordinate} from "../../lib/geometry/Coordinate";

describe("Intervals", function () {

    const zeroTenIncl = new Interval(0, 10, 1, true, true);
    const zeroTenExcl = new Interval(0, 10, 1, false, false);
    const aLittle = 0.0000000001;
    const aLittleMore = 0.000000001;
    const containsMsg = (num: number, interval: Interval, shouldBe: boolean): string =>
        `${interval.min} ${interval.lowerBoundInclusive ? "≤" : "<"} ${num} ${interval.upperBoundInclusive ? "≤" : "<"} ${interval.max} should be ${shouldBe} but is ${interval.contains(num)}`

    it("should handle inclusive boundaries properly", function () {

        const {
            max, min
        } = zeroTenIncl;

        // exhaustive
        for (let n = zeroTenIncl.min; n <= zeroTenIncl.max; n += zeroTenIncl.step) {
            const shouldIncludeALittleLess = n > min;
            const shouldIncludeALittleMore = n < max;

            assert.strictEqual(zeroTenIncl.contains(n),  true, containsMsg(min, zeroTenIncl, true));
            assert.strictEqual(zeroTenIncl.contains(n - aLittle), shouldIncludeALittleLess, containsMsg(min, zeroTenIncl, true));
            assert.strictEqual(zeroTenIncl.contains(n + aLittle), shouldIncludeALittleMore, containsMsg(min, zeroTenIncl, true));
        }

    });
    it("should handle exclusive boundaries properly", function () {

        const {
            max, min
        } = zeroTenExcl;

        // exhaustive
        for (let n = zeroTenExcl.min; n <= zeroTenExcl.max; n += zeroTenExcl.step) {
            const shouldIncludeALittleLess = n > min + aLittleMore;
            const shouldIncludeALittleMore = n < max - aLittleMore;
            const shouldIncludeN = n > min && n < max;

            assert.strictEqual(zeroTenExcl.contains(n), shouldIncludeN, containsMsg(min, zeroTenExcl, true));
            assert.strictEqual(zeroTenExcl.contains(n - aLittle), shouldIncludeALittleLess, containsMsg(min, zeroTenExcl, true));
            assert.strictEqual(zeroTenExcl.contains(n + aLittle), shouldIncludeALittleMore, containsMsg(min, zeroTenExcl, true));
        }

    });

    const weirdDomainMin = -5.34324,
          weirdDomainMax = 7.777788;
    const weirdDomain = new Interval(weirdDomainMin, weirdDomainMax, 2);
    const weirdDomainNumbers = [weirdDomainMin, -3, -1, 1, 3, 5, 7, weirdDomainMax];

    it("should snap values to correct step starting from minimum", function () {

        const {
            max, min, step
        } = weirdDomain;

        // outside of domain should snap to edge
        assert.strictEqual(
            weirdDomain.snap(min - aLittle),
            min
        );
        assert.strictEqual(
            weirdDomain.snap(min + aLittle),
            min
        );
        assert.strictEqual(
            weirdDomain.snap(min),
            min
        );
        assert.strictEqual(
            weirdDomain.snap(max - aLittle),
            max
        );
        assert.strictEqual(
            weirdDomain.snap(max + aLittle),
            max
        );
        assert.strictEqual(
            weirdDomain.snap(max),
            max
        );

    });

    it("should iterate over correct domain numbers", function () {

        weirdDomain.forEach((n, i) => {

            assert.strictEqual(weirdDomainNumbers[i], n, `Number at index ${i} is ${n} but should be ${weirdDomainNumbers[i]}`);

        });

    });

    it("should implement map() correctly", function () {

        const sampleCallback = (n: number, i: number): string => `Mapped number at index ${i}: ${n}`;

        const sampleMappedArray = weirdDomainNumbers.map(sampleCallback);
        const mappedArray = weirdDomain.map(sampleCallback);

        sampleMappedArray.forEach((n, i) =>
            assert.strictEqual(mappedArray[i], n, `Mapped string at index ${i} is ${mappedArray[i]} but should be ${n}`))

    });

    it("should clamp properly", function () {

        function randomInRange(min, max) {
            return Math.random() < 0.5 ? ((1-Math.random()) * (max-min) + min) : (Math.random() * (max-min) + min);
        }
        const margin = 10;

        // test 1000 random numbers
        for (let i = 0; i < 1000; i++) {
            const n = randomInRange(weirdDomainMin - margin, weirdDomainMax + margin);
            let expected = n;

            if (n < weirdDomainMin) expected = weirdDomainMin;
            else if (n > weirdDomainMax) expected = weirdDomainMax;

            assert.strictEqual(weirdDomain.clamp(n), expected, `clamp(${n}) => ${weirdDomain.clamp(n)};\nExpected: ${expected}`)
        }

    });

    it("should implement IComparable properly", function () {

        const comparableDomain = new Interval(weirdDomainMin, weirdDomainMax, 2);

        assert.strictEqual(weirdDomain.equals(comparableDomain), true, "Should equal equivalent domain");
        assert.strictEqual(weirdDomain.equals(new Coordinate(43, 5453523)), false, "Should false on different comparable object");
        assert.strictEqual(weirdDomain.equals(zeroTenExcl), false, "Should false on different domains");
        assert.strictEqual(zeroTenExcl.equals(zeroTenIncl), false, "Should false on different inclusion parameters");
        assert.strictEqual(zeroTenExcl.equals(zeroTenExcl), true, "Should equal on same object instance");

    });

});