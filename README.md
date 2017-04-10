# kmeans-same-size
This a variation of k-means algorithm with the same size for each group oriented to waypoints with a distribution heterogeneously  on a city.

### Installation
```$ npm install kmeans-same-size```

### Example
```
const KmeansLib = require('kmeans-same-size');
var kmeans = new KmeansLib();
const k = 10; // Groups Number
const size = 3 // Group size

let vectors = [
  { x: -1.10, y: -1.10 },
  { x: -1.20, y: -1.20 },
  { x: -1.30, y: -1.30 },
  { x: -1.40, y: -1.40 },
  { x: -1.50, y: -1.50 },
  { x: -1.60, y: -1.60 },
  { x: -1.70, y: -1.70 },
  { x: -1.80, y: -1.80 },
  { x: -1.90, y: -1.90 },
  { x: -1.91, y: -1.92 },
  { x: -1.93, y: -1.93 }
]

kmeans.init({k: k, runs: size, equalSize: true, normalize: false });

const sum = kmeans.calc(vectors);
The vector is mutated
console.log(vectors);

```
