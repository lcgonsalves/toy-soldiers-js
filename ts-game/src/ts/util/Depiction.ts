
export class SimpleDepiction {
    
    public readonly fill: string;
    public readonly stroke: string;
    public readonly strokeWidth: number;

    constructor(fill: string = "none", stroke: string = "none", strokeWidth: number = 1) {
        this.fill = fill
        this.stroke = stroke
        this.strokeWidth = strokeWidth
    }

}
