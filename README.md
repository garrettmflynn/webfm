# webfm

> A web-based functional mapping utility.

...

# Prerequisites

In order to run WebFM, you'll need:

1. A working [Node][node] installation
2. ( ... BCI2000 / BCI2000Web dependencies ... )

...

# Installation

Installing WebFM requires three steps:

1. Cloning the WebFM git repository
2. Installing the Node dependencies *via* `npm` for the *server* and for the
   *client*
3. Building the client application scripts

## Git

To clone the WebFM repo, navigate to wherever you'd like WebFM to be installed
and run

```
git clone https://github.com/cronelab/webfm.git
```

## Node

Let `{webfm}` denote the path to the root of the WebFM repository. First, navigate to `{webfm}` and run

```
npm install
```

This will install the dependencies for the WebFM server.

For the client, navigate to `{webfm}/app` and once again run

```
npm install
```

## Build

To build the client application scripts, navigate to `{webfm}/app` and run

```
./build
```

To test that everything has installed properly, navigate to `{webfm}` and run

```
node webfm
```

You should see

```
Serving {webfm}/public on 54321:tcp
```

If you encounter issues starting the server on the default port, you can
specify a port that works with the `-p` option:

```
node webfm -p 8080
```

# Usage

...

# Data formats

WebFM has two distinct ways of packaging data: **datasets**, which encapsulate
one viewable record—one spatial map, one event-related activity/connectivity
map, *etc.*—and **bundles**, which wrap together multiple related datasets
into a unified unit.

## Dataset

Datasets, which have the `.fm` file extension, are simply JSON files with a
designated structure. Datasets contain two kinds of information: **metadata**,
which are extra bits of information that give the data needed (or useful)
context; and **contents**, which are the actual data points of interest.

### Metadata

The fields in a dataset's metadata—stored in the dataset's `metadata`
field—provide the information necessary for the WebFM viewer to properly
render the enclosed data. All fields of the metadata are optional; however,
for certain kinds of data, certain combinations of omitted metadata may make
it so that WebFM does not have sufficient information to render the data
properly.

Metadata may also exist in standalone files (usually named `.metadata`) for
use, *e.g.*, with the `_import` field described below. For example, bundles
have a unified `.metadata` file `_import`ed by all of the bundle members, to
prevent duplication of large chunks of common metadata. As another example,
WebFM stores a `.metadata` file for each subject, which contains the
subject-specific metadata necessary to do online mapping (`brainImage`,
`sensorGeometry`, *etc.*).

The following are the (presently) meaningful metadata fields, as well as
example values:

####`_import`

Examples: `"./.metadata"`, `["/path/number/1", "/path/number/2", ... ]

A string (or array of strings) specifying files to import and incorporate as
additional metadata. If an array, files will be loaded in the specified order.
The server performs these imports when the dataset is requested by a client;
as such, this field is never present in the final dataset object served to the
client.

####`_export`

Example:

```json
{
    "brainImage": "./PYXXNXXX-Brain.png",
    "sensorGeometry": "./PYXXNXXX-Sensors.csv"
}
```

The `_export` field is used to denote operations that should be performed by
the export utility to produce a final dataset—for example, base64-encoding an
image, or converting a spreadsheet to a *u*-*v* map. This field should not be
present in a fully formed dataset.

####`subject`

Example: `"PYXXNXXX"`

The identifier of the subject from whom this data originated

####`brainImage`

Example: `"data:image/.png;base64,iVBORw0KG..."`

A string containing the base64-encoded binary image data to be used when
displaying the data on a spatial map

####`sensorGeometry`

Example:

```json
{
    "CH1": {
        "u": 0.1,
        "v": 0.4
    },
    ...
}
```
A mapping from channel names to *u*-*v* coordinates (ranging from 0 to 1 on
each axis) for placing electrodes on the `brainImage`

####`montage`

Example: `["CH01", "CH02", "CH03", ... ]`

A list of channel names, specifying both *which* channels should be displayed
and, when relevant, *in what order*.

####`setting`

Example:

```json
{
    "task": "PictureNaming",
    "stimulusType": "animals"
}
```

An object providing details on the context in which the data were collected

####`kind`

Example: `"event related potential"`

A human-readable description of what kind of data is in this dataset

####`labels`

Example: `["timeseries", "potential", "bipolar"]`

An array of strings providing information about how the data should be
displayed or interpreted

### Contents

...

####`values`

Example:

```json
{
    "CH01": [0.0, 0.01, ... ],
    ...
}`

Raw values to be plotted as-is, formatted as an object mapping channel names
to values. When this field is present, it is implied that no statistical
computations should be performed before displaying the data.

####`stats`

An object describing the statistical properties of the data, allowing the
WebFM frontend to perform its own statistical work (*e.g.*, multiple
comparison correction). The structure of this object is described in more
detail [below](#stats).

####`trials`

An array of objects, each depicting one realization of the data encapsulated
by the dataset. The structure of these objects is described in more detail
[below](#trials).

### Stats

...

####`distribution`

Meaningful values: `"gaussian"`, `"p-value"`

The kind of distribution described by the entry in the `estimators` field

####`estimators`

Example:

```json
{
    "mean": {
        "CH01": [ ... ],
        ...
    },
    "variance": {
        "CH01": [ ... ]
        ...
    },
    ...
}
```

...

Each `distribution` implies its own set of fields that should be present in `estimators`. The following distributions are supported:

| `distribution` value | Meaning | `estimators` fields |
| `"gaussian"` | Normal distributions | `"mean"`, `"variance"`, `"count"` |
| `"p-value"` | Raw *p*-values from some unspecified hypothesis test | `"value"` (to be displayed), `"p"` |

### Trials

...

Each trial has the following fields:

| Field | Example | Details |
| --- | --- | --- |
| `setting` | `{"stimulusCode": 0}` | ... |
| `values` | `{"CH01": [0.0, 0.01, ... ], ... }` | 


## Bundle

Bundles, which have the `.fmbundle` extension, are simply directories with a
designated structure.

...

## Common data layouts

...

### Event-related band power

...

### Resting state connectivity

...

### Event-related connectivity

...

### Event-related potential

...


# License

...


[node]: https://nodejs.org/