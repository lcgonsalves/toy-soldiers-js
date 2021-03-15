
/**
 * Defines objects that can be converted back and forth from strings.
 */
export interface ISerializable {

    /** Returns a string representing the instance of this object at the time of serialization. Same as ISerializable.simplified.toString() */
    readonly serialize: string;

    /** Returns a simplified object that can be used to construct composite serializables. */
    readonly simplified: SerializableObject;

    // todo: make a way to parse this back

}

export interface ICopiable {

    /** returns an instance of this object with the equivalent content */
    duplicate(): this;

}

/**
 * Simple version of the object. Intermediate step between serializing and stringifying.
 * You can either stringify it from here, or use it to compose other serializable objects.
 */
export interface SerializableObject<T = {}> {
    readonly content: T,
    readonly toString: () => string
}

/**
 * Shorthand for instantiating a serializable object.
 * @param obj
 * @constructor
 */
export function SObj<T>(obj: T): SerializableObject<T> {
    const s = JSON.stringify(obj);
    return {
        content: obj,
        toString: () => s
    }
}

export class IncompatibleSerializationStringError extends Error {}
