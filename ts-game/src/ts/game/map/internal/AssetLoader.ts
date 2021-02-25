import {svg} from "d3-fetch";
import {ICoordinate} from "ts-shared/build/lib/geometry/Coordinate";
import SVGAttrs from "../../../util/SVGAttrs";
import Rectangle from "ts-shared/build/lib/geometry/Rectangle";

/**
 * Component responsible for loading backend assets into the front end.
 */
class AssetLoader {

    public readonly icons: Map<string, HTMLElement> = new Map<string, HTMLElement>();

    // these should be complied to by the assets to avoid problems
    public defaultWidth: number = 10;
    public defaultHeight: number = 10;
    public defaultViewBoxDimensions: [number, number] = [10, 10];

    // this is just so we have a default set for error catching
    public defaultScale: number = 1.0;

    public get ICON_CLS(): string { return "asset_icon" };

    /**
     * Loads all basic assets on initialization.
     */
    constructor() {

        const iconNames = [
            "connect"
        ];

        // define here all asset strings
        iconNames.forEach(assetName => svg("/images/" + assetName).then(_ => {

            const e = _.documentElement;
            e.setAttribute("class", this.ICON_CLS);

            this.icons.set(assetName, e);

        }));

    }

    /**
     * Returns icon placed within the required bounds.
     *
     * @param iconName
     * @param bounds
     */
    getIcon(iconName: string, bounds: Rectangle, copy?: boolean): HTMLElement | undefined {

        const i = this.icons.get(iconName);
        i?.setAttribute(SVGAttrs.x, bounds.topLeft.x.toString());
        i?.setAttribute(SVGAttrs.y, bounds.topRight.y.toString());

        const wOption =  i?.getAttribute(SVGAttrs.width);
        const width = parseInt(wOption ? wOption : this.defaultWidth.toString());

        const hOption =  i?.getAttribute(SVGAttrs.height);
        const height = parseInt(hOption ? hOption : this.defaultHeight.toString());

        // find how much bigger/smaller we need to be
        const xRatio = bounds.width / width;
        const yRatio = bounds.height / height;

        // if we are BIGGER than bounds, then we need to SHRING (number is small, you idiot)
        const newWidth = width * xRatio,
              newHeight = height * yRatio;

        i?.setAttribute(SVGAttrs.width, newWidth + "px");
        i?.setAttribute(SVGAttrs.height, newHeight + "px");

        return copy ? i?.cloneNode(true) as HTMLElement | undefined : i;
    }

}

export default new AssetLoader();
