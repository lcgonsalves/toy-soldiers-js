import {defaultColors} from "./DrawHelpers";
import {SimpleDepiction} from "./Depiction";

export class GenericAction {

    public readonly key: string;
    public readonly name: string;
    public readonly apply: (param: any) => any;

    constructor(key: string, name: string, apply: (param: any) => any) {
        this.key = key;
        this.name = name;
        this.apply = apply;
    }

}

export class TargetAction<Target> extends GenericAction {

    /** executes the action */
    public readonly apply: (t: Target) => void;

    /** previews effect of executing action */
    public readonly preview: (t: Target) => void;

    /** stops previewing effect of executing action */
    public readonly stopPreview: (t: Target) => void;

    /** how button should depict this action */
    public depiction: SimpleDepiction = TargetAction.depiction.neutral;

    constructor(
        key: string,
        name: string,
        depiction: SimpleDepiction = TargetAction.depiction.neutral,
        fn: (t: Target) => void
        , preview: { start: (t: Target) => void; stop: (t: Target) => void } = {
            start: () => {
            },
            stop: () => {
            }
        }) {
        super(key, name, fn);

        this.preview = preview.start;
        this.stopPreview = preview.stop;
        this.apply = fn;
        this.depiction = depiction;

    };

    // default kinds of action depictions
    public static depiction = {
        main: new SimpleDepiction(defaultColors.primary, "none", 1, 1),
        delete: new SimpleDepiction(defaultColors.error, "none", 1, 1),
        success: new SimpleDepiction(defaultColors.success, "none", 1, 1),
        neutral: new SimpleDepiction(defaultColors.grays.light, "none", 1, 1)
    }

}

// shorthand the constructor
export function TAction<Target>(
    key: string,
    name: string,
    depiction: SimpleDepiction,
    fn: (t: Target) => void,
    preview?: { start: (t: Target) => void; stop: (t: Target) => void }
): TargetAction<Target> {
    return new TargetAction(key, name, depiction, fn, preview)
}
