
// TODO: decide what to do with this

/**
 * Returns a function that outputs the position of the object at a given time.
 * @param dropFrom starting height of object
 * @param decayConstant decay constant
 * @param time time unit
 */
export function bounce(
    dropFrom: number,
    decayConstant: number,
    angularFrequency: number,
    phaseAngle: number
): (time: number) => number {

    const {
        E,
        pow,
        cos
    } = Math;

    return function (time: number): number {

        return dropFrom * pow(E, - decayConstant * time) * cos((angularFrequency * time) + phaseAngle);

    }

}

const stop = () => frameCount >= maxFrames;
let customDrawFunction: (time: number, frame: number) => void = () => {};
let fpsInterval: number,
    frameCount: number = 0,
    maxFrames: number = 10,
    startTime: number,
    now: number,
    then: number,
    elapsed: number;

/**
 * Plays animation if no other animation is already being played.
 * @param duration
 * @param fps
 * @param drawFunction
 */
export function playAnimation(duration: number, fps: number = 30, drawFunction: (time: number, frame: number) => void): void {
    maxFrames = duration * fps;
    customDrawFunction = drawFunction;
    startAnimating(fps);
}

/**
 * Begins animating
 * @param fps
 * @param drawFunction
 */
export function startAnimating(fps: number): void {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    animate();
}

function animate(): void {

    // stop
    if (stop()) {
        frameCount = 0;
        maxFrames = 0;
        return;
    }

    // request another frame

    requestAnimationFrame(animate);

    // calc elapsed time since last loop

    now = Date.now();
    elapsed = now - then;

    // if enough time has elapsed, draw the next frame

    if (elapsed > fpsInterval) {

        // Get ready for next frame by setting then=now, but...
        // Also, adjust for fpsInterval not being multiple of 16.67
        then = now - (elapsed % fpsInterval);
        frameCount++;

        // draw stuff here
        customDrawFunction(elapsed, frameCount);

    }

    return;

}
