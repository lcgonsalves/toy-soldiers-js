/**
 * Improved Map collection, using Dictionary colleciton.
 */
import {Dictionary} from "typescript-collections";

export default class EMap<K, V> extends Dictionary<K, V>{

    public map(transformation: (k: K, v: V) => [K, V]): EMap<K, V> {
        const ret = new EMap<K, V>();

        this.forEach((k, v) => {

            const [newK, newV] = transformation(k, v);
            ret.setValue(newK, newV);

        });

        return ret;
    }

    public filter(predicate: (k: K, v: V) => boolean) {
        const ret = new EMap<K, V>();

        this.forEach((k, v) => {

            if (predicate(k, v)) ret.setValue(k, v);

        });

        return ret;
    }

    /**
     * Returns a sorted array containing the key value pairs ordered as defined by the predicate.
     * a should come before b if the return value is negative.
     * @param predicate
     */
    public sort(predicate: (a: [k: K, v: V], b: [k: K, v: V]) => number): {key: K, value: V}[] {
        const key = this.keys();
        const value = this.values();

        return key.map(
            (k, i): {key: K, value: V} => {
                return {key: k, value: value[i]};
            }).sort((a, b) => predicate([a.key, a.value], [b.key, b.value]));

    }

    /**
     * Tuples together an external array with the values of this map. If arrays are of different lengths,
     * the function will return undefined value pairings for the array that is shorter.
     *
     * Ex:
     *  other: [1, 2, 3, 4, 5]
     *  this.values: ["A", "B", "C"]
     *
     *  returns: [ ["A", 1], ["B", 2], ["C", 3], [undefined, 4], [undefined, 5] ]
     *
     * @param other
     */
    public zipValues<T>(other: T[]): Array<[V | undefined, T | undefined]> {
        const values = this.values();

        // iterate largest. JS returns by default undefined for out-of-bounds-indexes
        return values.length > other.length ?
            values.map((v, i) => [v, other[i]]) :
            other.map((o, i) => [values[i], o]);

    }


}
