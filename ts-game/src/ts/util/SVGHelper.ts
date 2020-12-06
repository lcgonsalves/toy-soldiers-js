/** Provides string tags for all SVG Element types used in D3 */
export class SVGTags {
    
    static SVGCircleElement: string = "";
    static SVGAElement: string = "";
    static SVGClipPathElement: string = "";
    static SVGDefsElement: string = "";
    static SVGDescElement: string = "";
    static SVGEllipseElement: string = "";
    static SVGFEBlendElement: string = "";
    static SVGFEColorMatrixElement: string = "";
    static SVGFEComponentTransferElement: string = "";
    static SVGFECompositeElement: string = "";
    static SVGFEConvolveMatrixElement: string = "";
    static SVGFEDiffuseLightingElement: string = "";
    static SVGFEDisplacementMapElement: string = "";
    static SVGFEDistantLightElement: string = "";
    static SVGFEFloodElement: string = "";
    static SVGFEFuncAElement: string = "";
    static SVGFEFuncBElement: string = "";
    static SVGFEFuncGElement: string = "";
    static SVGFEFuncRElement: string = "";
    static SVGFEGaussianBlurElement: string = "";
    static SVGFEImageElement: string = "";
    static SVGFEMergeElement: string = "";
    static SVGFEMergeNodeElement: string = "";
    static SVGFEMorphologyElement: string = "";
    static SVGFEOffsetElement: string = "";
    static SVGFEPointLightElement: string = "";
    static SVGFESpecularLightingElement: string = "";
    static SVGFESpotLightElement: string = "";
    static SVGFETileElement: string = "";
    static SVGFETurbulenceElement: string = "";
    static SVGFilterElement: string = "";
    static SVGForeignObjectElement: string = "";
    static SVGGElement: string = "";
    static SVGImageElement: string = "";
    static SVGLineElement: string = "";
    static SVGLinearGradientElement: string = "";
    static SVGMarkerElement: string = "";
    static SVGMaskElement: string = "";
    static SVGMetadataElement: string = "";
    static SVGPathElement: string = "";
    static SVGPatternElement: string = "";
    static SVGPolygonElement: string = "";
    static SVGPolylineElement: string = "";
    static SVGRadialGradientElement: string = "";
    static SVGRectElement: string = "";
    static SVGScriptElement: string = "";
    static SVGStopElement: string = "";
    static SVGStyleElement: string = "";
    static SVGSVGElement: string = "";
    static SVGSwitchElement: string = "";
    static SVGSymbolElement: string = "";
    static SVGTextElement: string = "";
    static SVGTextPathElement: string = "";
    static SVGTitleElement: string = "";
    static SVGTSpanElement: string = "";
    static SVGUseElement: string = "";
    static SVGViewElement: string = "";
    private static selfReference: SVGTags | null = null;

    private constructor() {}

    // initializes map
    static initialize(): SVGTags {
        const values = [
            "clipPath",
            "defs",
            "desc",
            "ellipse",
            "feBlend",
            "feColorMatrix",
            "feComponentTransfer",
            "feComposite",
            "feConvolveMatrix",
            "feDiffuseLighting",
            "feDisplacementMap",
            "feDistantLight",
            "feFlood",
            "feFuncA",
            "feFuncB",
            "feFuncG",
            "feFuncR",
            "feGaussianBlur",
            "feImage",
            "feMerge",
            "feMergeNode",
            "feMorphology",
            "feOffset",
            "fePointLight",
            "feSpecularLighting",
            "feSpotLight",
            "feTile",
            "feTurbulence",
            "filter",
            "foreignObject",
            "g",
            "image",
            "line",
            "linearGradient",
            "marker",
            "mask",
            "metadata",
            "path",
            "pattern",
            "polygon",
            "polyline",
            "radialGradient",
            "rect",
            "script",
            "stop",
            "style",
            "svg",
            "switch",
            "symbol",
            "text",
            "textPath",
            "title",
            "tspan",
            "use",
            "view",
        ];
        this.selfReference = this.selfReference ? this.selfReference : new SVGTags();

        Object.values(this.selfReference).forEach((type, index) => type = values[index]);
        return this.selfReference;
    } 
    
}
SVGTags.initialize();

export abstract class SVGAttrs {

    public static cx: string = "cx";
    public static cy: string = "cy";
    public static r: string = "r";
    public static x: string = "x";
    public static y: string = "y";
    public static d: string = "d";

}
