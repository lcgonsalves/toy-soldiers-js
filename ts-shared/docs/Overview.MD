# Toy Soldiers Implementation Overview

This document outlines how exactly the moving parts interact with one another, and the paradigms in which they are based
upon. This entire concept is expanded from an implementation of a Graph (nodes and edges), and thus provides the flexibility
to apply Graph theory concepts in many different ways.
---
## The Basics

The interfaces that define the most basic graph operations are defined in [GraphInterfaces.ts](../lib/graph/GraphInterfaces.ts), and
they describe methods such as `connectTo`, `disconnectFrom`, etc. You may implement your own nodes and edges if you feel the need
to build from the ground up, but the shared library provides the foundations for building upon, instead of reinventing the wheel.

### `AbstractNode`
Implements all the basic methods of an `IGraphNode`, but does not define what a `node.copy` or `node.equals` is. Any classes extending
from `AbstractNode` must define what equality looks like to avoid any issues down the road.

This class extends `Coordinate` so it behaves like a coordinate, as well as having translation, distance, and other helper methods
available within its context.

[Source](../lib/graph/AbstractNode.ts)

### `SimpleDirectedEdge`
Implements the basic concept of connecting two nodes together, directionally. Nodes are aware of their neighbors, and use the `IGraphEdge`
iterface to keep track of those connections. It has some methods wrapped in its context, that allow for some mathematical ease, such as
`edge.length` which simply calculates the distance between its connecting nodes, and others.

[Source](../lib/graph/SimpleDirectedEdge.ts)

### `SimpleDirectedGraph`
Implementation of a collection of `IGraphNode`s, and helper methods to manage this collection. It is used, in this app, as a jumping point for more interesting
classes, like the WorldContext and its derived classes.

[Source](../lib/graph/SimpleDirectedGraph.ts)

---

## The Intermediates
These basic implementations are just the foundation. The game itself is structured around the following pillars:

### `Battleground`
Describes the physical geography in which a game takes place. At its simplest, it is a collection of `Base`s and `Road`s in which
`Pawn`s can be located at, or move through. Different battlegrounds may differ not only in topography but in internal logic. A battleground may,
for example, disable a `Road` every other round, and other crazy crazy stuff.

_Source not yet available_

### `Base`
Describes a location in which `Pawns` may be located at. These define internal rules such as how many pawns may stay in them,
if more pawns are generated at every turn, if it can be attacked, and other stats.

_Source not yet available_

### `Road`
Describes the physical geography of an Edge that may connect a `Base` to one or more `Bases`. It may have internal rules
that define when a pawn may move through them, if it is closed, etc.

_Source not yet available_

### `Pawn`
Most basic description of an actor in the game. Pawns may stay in `Base`s, move through `Road`s, interact with other `Pawn`s,
and other actions. Pawns have health and will die when its HP reaches zero. Each Pawn implementation has to define how those
stats behave.

_Source not yet available_

### `Army`
Describes the concept of armed forces. An `Army` implements logic that determines what kinds of Pawns it uses, any special
effects when its Pawns interact with other pawns of different armies, which bases it has access to, etc. It is not a collection
of `Pawn`s, but it manages the collection of its `Pawn`s that are active in a game. Represents a Player. Players control armies.

_Source not yet available_

### `Coalition`
It's a team. Since each player controls an `Army`, each team is a `Coalition` that defines which armies are associated with each other.
These coalitions may implement specific effects when different armies work together.

_Source not yet available_