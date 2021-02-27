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

    public readonly apply: (t: Target) => void;
    public depiction: SimpleDepiction = TargetAction.depiction.neutral;

    constructor(key: string, name: string, fn: (t: Target) => void) {
        super(key, name, fn);
        this.apply = fn;
    };

    // default kinds of action depictions
    public static depiction = {
        main: new SimpleDepiction(defaultColors.primary),
        delete: new SimpleDepiction(defaultColors.error),
        success: new SimpleDepiction(defaultColors.success),
        neutral: new SimpleDepiction(defaultColors.grays.light)
    }

}

// shorthand the constructor
export function TAction<Target>(key: string, name: string, fn: (t: Target) => void): TargetAction<Target> { return new TargetAction(key, name, fn) }
