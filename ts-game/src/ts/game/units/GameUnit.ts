import {Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {BaseType, Selection} from "d3-selection";
import {Transition, transition} from "d3-transition";
import SVGAttrs from "../../util/SVGAttrs";
import SVGTags from "../../util/SVGTags";
import {easeExpIn} from "d3-ease";

/**
 * @author Léo Gonsalves
 *
 * Describes an individual, physical, abstract game unit. Game units are the building blocks of Toy Soldiers. These are
 * used to represent, on the board, locations, players, paths, and others. They describe interfaces for the most basic
 * interactions between units, as well as instantiation in the Game Map and transformations within the grid.
 *
 * How to use:
 *
 * Extend this class and implement the abstract methods:
 *  - renderDepiction -> append elements to the existing groups
 *  - updateDepiction -> update attr's according to datum
 *  - removeDepiction -> remove appended elements
 *
 * Order of rendering can be manipulated by passing a custom "preprocess(s: Selection): void" function
 * to the constructor, where you can append other groups in the order that you'd like.
 *
 * After instantiating the extended class, you must manually call "render()" to append
 * the svg elements for the first time.
 *
 * If the contents of the AssociatedDatum change, you must call "refresh()" to update
 * the attributes of the associated elements according to your implementation.
 *
 * If the GameUnit is removed, call "remove()"
 *
 */
export default abstract class GameUnit<
    AssociatedDatum,
    AssociatedElement extends SVGGElement = SVGGElement,
    ParentElement extends BaseType = SVGElement,
    ParentDatum = any
    > extends Coordinate {

    /** The D3 selection to which this GameUnit is anchored to */
    protected anchor: Selection<AssociatedElement, AssociatedDatum, ParentElement, ParentDatum>;
    /** The data associated with this selection that may describe how this game unit is rendered */
    protected datum: AssociatedDatum;
    /** The unique identifier for this unit. Used for D3 selection. */
    protected _id: string;
    /** The string representation of the GameUnit.
     * i.e. ClassName -> class_name
     * Should be overridden by each implementation */
    protected readonly _tag: string;

    /** Shorthand Types */

    protected constructor(
        // unique identifier for the associated datum / representation of this unit
        id: string,
        // coordinates
        x: number,
        y: number,
        // set of properties that define how the game unit is rendered / reacts
        datum: AssociatedDatum,
        // d3 selection in which anchor will be appended to
        anchor: Selection<any, any, any, any>,
        // string that represents the name of the unit in general
        tag: string = "game_unit",
        // callback that allows initializer to append elements before regular rendering cycle
        preprocess?: (unprocessedAnchor: Selection<AssociatedElement, AssociatedDatum, ParentElement, ParentDatum>) => void
    ) {
        super(x, y);

        this._id = id;
        this._tag = tag;

        const a = anchor.append<AssociatedElement>(SVGTags.SVGGElement);
        a.attr(SVGAttrs.id, this.id)
            .classed(this.css, true);

        this.datum = datum;

        // preprocess if needed
        if (preprocess) preprocess(a);

        // associate it here to avoid a `this` reference in the preprocess callback
        this.anchor = a;

    }

    /**
     * Data Join.
     * Joins the current reference of `data` to the selection
     * Analogous to Selection.data(data).
     *
     * @returns {Selection<SVGGElement, AssociatedNode, any, any>} selection after data join
     * @protected */
    protected updateReference(): Selection<AssociatedElement, AssociatedDatum, ParentElement, ParentDatum> {
        this.renderDepiction();
        return this.current;
    }

    /**
     * @abstract
     * @protected
     *
     * Upon a data join with unchanged associated data, updates depiction of game unit. */
    protected abstract updateDepiction(): void;

    /**
     * @abstract
     * @protected
     *
     * Upon first time join with associated data, append depiction of game unit. */
    protected abstract renderDepiction(): void;

    /**
     * @abstract
     * @protected
     *
     * Upon a data removal or re-association, remove the depiction of the game unit. */
    protected abstract removeDepiction(): void;

    /**
     * @abstract
     * @protected
     *
     * Executes internal updates by mapping AssociatedDatum to internal variables, if needed. For example, if AssociatedDatum
     * is a Node in a graph, this function would update this.x and this.y to represent the current version of this.datum.
     */
    protected abstract propagateDatumUpdate(): void;


    /**
     * Defines the css classname associated with the unit. Is associated with the
     * parent SVG group element of this unit. By default, it is the tag.
     */
    public get css(): string { return this.tag; };

    /**
     * Defines a tag associated with this unit. Tags are a string representation of
     * the name of this Unit. It is used to build the ID, which can be used to select
     * units of this type from outside of this context.
     *
     * i.e. GameUnit has a tag "game_unit"
     */
    public get tag(): string { return this._tag; }

    /**
     * Defines the CSS id of the Game Unit. It is ideally composed of a combination of the
     * tag and the _id of the Unit.
     */
    public get id(): string { return `${this.tag}_${this._id}`; }

    /**  Propagates current state of datum internally and returns Anchor selection with the most recent datum joined. */
    public get current():
        Selection<AssociatedElement, AssociatedDatum, ParentElement, ParentDatum> {
        this.propagateDatumUpdate();
        return this.anchor.datum<AssociatedDatum>(this.datum);
    }

    /** Re-triggers rendering with the same AssociatedData reference. Chainable. */
    public refresh(): GameUnit<AssociatedDatum, AssociatedElement, ParentElement, ParentDatum> {
        this.updateDepiction();
        return this;
    }

    /** Appends svg elements to the DOM. Should only be called once per instance. */
    public render(): void {
        this.renderDepiction();
    }

    /** Re associates data with new reference and re-triggers rendering of GameUnit. Chainable. */
    public update(newDatumRef: AssociatedDatum): GameUnit<AssociatedDatum, AssociatedElement, ParentElement, ParentDatum> {
        this.datum = newDatumRef;
        this.removeDepiction();
        this.updateReference();
        return this;
    }

    /** Runs removal routine and gets element ready to be unmounted. Returns a promise that
     * resolves upon success. */
    public remove(): Promise<null> {
        return new Promise<null>(((resolve) => {
            this.anchor.datum(null);
            this.removeDepiction();
            resolve(null);
        }));
    }

}

/** Defines any additional css classes used in this game unit */
enum css {}

/** Defines some useful transition presets */
export abstract class DefaultGameUnitTransitions {

    private static snapIntoPlace: Transition<any, any, any, any> = transition()
        .duration(400)
        .ease(easeExpIn);

    static get SnapIntoPlace(): Transition<any, any, any, any> {
        return DefaultGameUnitTransitions.snapIntoPlace;
    }

}
