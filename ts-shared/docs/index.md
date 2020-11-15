# TSShared (Toy Soldiers Shared Module)
This module encompasses the shared components and concepts
used by the [`ts-game`](/ts-game/docs/index.md) and [`ts-server`](/ts-server/docs/index.md) modules.
It is responsible for implementing all game mechanics and other abstractions needed to
make the game work properly.

*This module is broken down into the following pieces:*

Component | Description | Documentation
----|----|----|
Geometry | Geometrical abstractions and other useful tools for cartesian space operations | [Source](/ts-shared/lib/geometry)
Graph | Implementation of a directed graph (node/edge) | [Source](/ts-shared/lib/graph)
Socket | Definitions for communication between front and back ends | [Source](/ts-shared/lib/socket)