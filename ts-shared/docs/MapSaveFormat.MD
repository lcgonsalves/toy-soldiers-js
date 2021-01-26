# Map Save Format Documentation

This document describes each field and uses of the game map save file. This file encodes the physical map in which
the game takes place. It defines certain behaviors of the map.

The file is encoded as a JSON, so utilize JSON syntax if you'd like to create one from scratch, or download one of the
examples below.

## Fields

------

### `bases`
An array containing all the Bases in the map. Bases are used, for example, as locations where players may stand, like
a square in chess, or monopoly. This encodes the class `Base` (implementation pending) in the following way:

```json
{
  "label": "House A",
  "description": "A description of house A in a sample game map",
  "id": "an idenitifying string unique amongst the other bases",
  "exits": [ ... ],
  "adjacent": [ ... ],
  "x": 12.4,
  "y": 45.7
}
``` 

Where:

- `exits`  is an array of strings of IDs of `Road` elements in the map. See how `Road`is defined in game (implementation pending) 
and how it is defined below.
- `adjacent`  is an array of strings of IDs of `Base` elements in the map that are accessible from this base.

---

### `roads`
An array containing all the Roads in the map. Roads are used to agglomerate a bunch of `Connector` (implementation pending) nodes together as 1 road,
which can connect different nodes together. This encodes the class `Connector` in the following way:

```json
{
  "label": "Road from A to B",
  "description": "A description of this road in a sample game map",
  "id": "an idenitifying string unique amongst the other roads",
  "from": "an identifying string unique amongst the bases defined in this file",
  "to": [ ... ] // an array of IDs unique amongst the bases defined in this file
}
```