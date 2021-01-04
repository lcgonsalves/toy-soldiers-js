# Toy Soldiers
A fun little web game about world domination, brain child of Léo Gonsalves!

### The Premise
The central idea that spawned this project was to create a web game using SVG visuals to 
encode a simple multiplayer, board-like game to be played on virtual (or not) lunch breaks
with co-workers. I hope to build it modular enough so that contributing to this repository
can be easy and fun, and so the individual instances of the game can have a high degree of
customization.

### Where to play
Toy Soldiers is not yet at a stage where it can be deployed to a public audience. But feel
free to clone this repository and try it out on your own machine! See instructions below.

----
### Getting started with the repository

#### File strucrture 
This project is organized into 3 main parts:
* `Game`
   * The React application, front end code 
   * Makes use of the shared game logic, and other concepts
* `Server`
   * DeprecatedNode app, works the websocket transmissions between clients, and multiplayer logic
   * Makes use of some shared game logic and other concepts
* `Shared`
   * Bulk of the mechanics. Where shared abstractions are defined (Game Objects, Coordinates, etc)
   * You will probably edit this alongside `Game`
   
#### First time setup
When you clone the repository for the first time you can install all the dependencies by running
`npm run setup` in the root folder. If you intend on making local changes to `ts-shared` you should 
`npm link` the shared folder.

You can do so by running `npm run linkShared` in the root folder, or manually.
   
#### Launching
You can launch both the front end and the back end by running the following commands from
the directory root, respectively:

1. Front end: `npm run startFront`
1. Back end: `npm run startServer`

When making edits to the `ts-shared` module, you can save some time by watching for file changes
by running `npm run watchShared` from the directory root, or, more generically `npm run watch` from
either of the 3 main modules.

#### Documentation
The code is thoroughly documented with JSDoc comments, and each individual module's documentation
can be found below:
* [Game Documentation (front)](ts-game/docs/index.md)
* [Server Documentation (back)](ts-server/docs/index.md)
* [Shared Documentation (both)](ts-shared/docs/index.md)

#### Contributing
Anyone can fork and modify this codebase. However, to contribute to this codebase
one must abide to certain rules:

* New additions should always be in reference to a Github issue
* New additions must be thoroughly documented with JSDoc comments
* Any affected parts of the code must have their documentation updated in the same pull request
* New modules must have a JSDoc page generated for them in the appropriate location
* Merge in the appropriate branch!

Thanks for respecting the organization of the repository! Let's get conquering!