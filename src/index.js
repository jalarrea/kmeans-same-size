/*
  Variation re-write by Leonardo Larrea to use in the server.
*/
function Kmeans() {
  return undefined;
}
var log = Math.log
, pow = Math.pow
, sqrt = Math.sqrt
, round = Math.round
, floor = Math.floor
, ceil = Math.ceil
, random = Math.random
, distance =  function(a, b) {
  return getDistance(a,b)
}
, sumReduce = function(a, b) {
  return a + b;
}
, sortBy = function (a, b, c) {
  c = a.slice();
  return c.sort(function (d, e) {
    d = b(d);
    e = b(e);
    return (d < e ? -1 : d > e ? 1 : 0)
  })
}
, Meta = function (id, item, x, y, ks) {
  this.id = id;
  this.item = item;
  this.x = x;
  this.y = y;
  this.dists = [];
  for (var k = 0; k < ks; k++)
    this.dists[k] = Infinity;
  this.primary = 0;
  this.secondary = 0;
};


function permute(input, permArr, usedChars) {
  var i, ch;
  for (i = 0; i < input.length; i++) {
    ch = input.splice(i, 1)[0];
    usedChars.push(ch);
    if (input.length == 0) {
      permArr.push(usedChars.slice());
    }
    permute(input, permArr, usedChars);
    input.splice(i, 0, ch);
    usedChars.pop();
  }
  return []
}

var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
  const R = 6378137; // Earth’s mean radius in meter
  let dLat = rad(p2.x - p1.x);
  let dLong = rad(p2.y - p1.y);
  let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.x)) * Math.cos(rad(p2.x)) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;
  return d; // returns the distance in meter
};

function createMatrixOfDistance(input){
  let arrayOfDistances = [];
  input.forEach((itemFrom)=>{
    let distances = [];
    input.forEach((itemTo)=>{
      distances.push(getDistance(itemFrom,itemTo));
    });
    arrayOfDistances.push(distances);
  })
  return arrayOfDistances;
}

Kmeans.prototype.getOptimalPermutation = function(pickup, input){
  let inputWithIndex = input.map((item, index)=>{
    item.index = index;
    return item;
  });
  let distances = createMatrixOfDistance(inputWithIndex);
   console.log('distances:',distances)


   let permutations = permute(inputWithIndex, [], []);
   console.log('permutations:',permutations)
  // const distancesPerm = permutations.map((permutation)=>{
  //   const totalDistance = (permutation.reduce((totalDistance, item, index, items)=>{
  //     if(index == 0)return totalDistance;
  //     return (totalDistance + distances[items[(index-1)].index][item.index]);
  //   },0) + getDistance(pickup,permutation[0]));
  //
  //   let permutationData = Object.assign({},{data: permutation}, {totalDistance: totalDistance});
  //   return permutationData;
  // }).sort((a,b)=>b.totalDistance-a.totalDistance)[0];
  //return distancesPerm.data
  return {};
}

/* Priority / badness: difference between best and worst. (Assuming that "secondary" is the worst). */
Meta.prototype.priority = function () {
  return this.dists[this.secondary] - this.dists[this.primary];
};

/* Gain from switching to cluster k */
Meta.prototype.gain = function (k) {
  return this.dists[this.primary] - this.dists[k];
};

    /* no. of clusters */
var ks = 5
    /* no. of runs (best result is returned) */
  , runs = 10
    /* make equally sized clusters */
  , equalSize = false
    /* nomalize (0-1) data. Changes data if true! */
  , normalize = false
    /* maximum size of a cluster */
  , maxsize = Infinity
    /* array of cluster objects */
  , centroids = []
    /* no. of points in data */
  , ps = 0
    /* data */
  , points = []
    /* arary of meta structures for each point */
  , metas = []


Kmeans.prototype.init = function (obj) {

  ks = obj.k;
  runs = obj.runs;
  equalSize = obj.equalSize;
  normalize = obj.normalize;

};

/* data array of point objects with coordinates { x: 0, y: 0 } */

Kmeans.prototype.calc = function (data) {

  ps = data.length;
  maxsize = equalSize ?  ceil(ps / ks) : Infinity;
  points = data;

  if (normalize)
    doNormalize();

  /* store result of each run */
  var result = [];

  for (var run = 0; run < runs; run++) {

    result[run] = { centroids: [], sum: Infinity };

    /* inital guess */
    kmeansplusplus();

    /* store initial centroids from kmeans++ in order to re-run */
    for(var k = 0; k < ks; k++) {
      result[run].centroids[k] = {
        x: centroids[k].x,
        y: centroids[k].y
      }
    }

    /* run kmeans */
    if (equalSize)
      kmeansEqualSize();
    else
      kmeans();

    /* calculate differences */
    result[run].sum = diffSum();

  }

  /* find best result */
  result.sort(function (a, b) {
    return a.sum - b.sum;
  });

  /* re-use initial centroids produced by kmeans++ from best run */
  centroids = [];
  for (var k = 0; k < ks; k++) {
    var centroid = {
        x: result[0].centroids[k].x
      , y: result[0].centroids[k].y
      , k: k
      , items: 0
      , data: {}
      , count: function () {
        var count = 0;
        for (var prop in this.data) {
          if (this.data.hasOwnProperty(prop))
            count++;
        }
        return count;
      }
    };
    centroids[k] = centroid;
  }

  /* run again with best initial centroids */
  if (equalSize)
    kmeansEqualSize();
  else
    kmeans();

  /* return sum */
  return diffSum();

};

/* nomalize (0-1) data. Coordinates in original data are altered */

var doNormalize = function () {

  /* get minimum and maximum x */
  points.sort(function (a, b) {
    return a.x - b.x;
  });

  var x_min = points[0].x;
  var x_max = points[ps - 1].x;

  /* get minimum and maximum y */
  points.sort(function (a, b) {
    return a.y - b.y;
  });

  var y_min = points[0].y;
  var y_max = points[ps - 1].y;

  /* normalize */
  for (var p = 0; p < ps; p++) {
    var point = points[p];
    point.x = (point.x - x_min) / (x_max - x_min);
    point.y = (point.y - y_min) / (y_max - y_min);
  }

};

/* initializes meta structure */

var initMetas = function () {

  /* cleas array */
  metas = [];
  for (var p = 0; p < ps; ++p) {

    var point = points[p];
    /* add cluster no. property */
    point.k = -1;
    var meta = new Meta(p, point, point.x, point.y, ks);

    for (var k = 0; k < ks; k++) {
      meta.dists[k] = distance(meta, centroids[k]);
      if (k > 0) {
        if (meta.dists[k] < meta.dists[meta.primary]) {
          meta.primary = k;
        } else if (meta.dists[k] > meta.dists[meta.secondary]) {
          meta.secondary = k;
        }
      }
    }

    metas[p] = meta;

  }

  /* add function to array to get points/items by id (i.e. index position of points array) */
  metas.id = function (id) {
    id = Number(id);
    for (var i = 0, is = this.length; i < is; i++) {
      if (this[i].id === id)
        return this[i];
    }
  };

};

/* k-means++ initialization from https://github.com/cmtt/kmeans-js */

var kmeansplusplus = function () {

  /* clear clusters */
  centroids = [];

  /* determine the amount of tries */
  var D = []
    , ntries = 2 + round(log(ks))
    ;

  /* 1. Choose one center uniformly at random from the data points. */
  var p0 = points[floor(random() * ps)];

  centroids.push({
      x: p0.x
    , y: p0.y
    , k: 0
    , items: 0
    , data: {}
    , count: function () {
      var count = 0;
      for (var prop in this.data) {
        if (this.data.hasOwnProperty(prop))
          count++;
      }
      return count;
    }
  });

  /* 2. For each data point x, compute D(x), the distance between x and the nearest center that has already been
    chosen. */
  for (i = 0; i < ps; ++i)
    D[i] = pow(distance(p0, points[i]), 2);

  var Dsum = D.reduce(sumReduce);

  /* 3. Choose one new data point at random as a new center, using a weighted probability distribution where a
    point x is chosen with probability proportional to D(x)2. (Repeated until k centers have been chosen.) */
  for (k = 1; k < ks; ++k) {

    var bestDsum = -1, bestIdx = -1;

    for (i = 0; i < ntries; ++i) {
      var rndVal = floor(random() * Dsum);

      for (var n = 0; n < ps; ++n) {
        if (rndVal <= D[n]) {
          break;
        } else {
          rndVal -= D[n];
        }
      }

      var tmpD = [];
      for (var m = 0; m < ps; ++m) {
        cmp1 = D[m];
        cmp2 = pow(distance(points[m], points[n]), 2);
        tmpD[m] = cmp1 > cmp2 ? cmp2 : cmp1;
      }

      var tmpDsum = tmpD.reduce(sumReduce);

      if (bestDsum < 0 || tmpDsum < bestDsum) {
        bestDsum = tmpDsum, bestIdx = n;
      }
    }

    Dsum = bestDsum;

    var centroid = {
        x: points[bestIdx].x
      , y: points[bestIdx].y
      , k: k
      , items: 0
      , data: {}
      , count: function () {
        var count = 0;
        for (var prop in this.data) {
          if (this.data.hasOwnProperty(prop))
            count++;
        }
        return count;
      }
    };

    centroids.push(centroid);

    for (i = 0; i < ps; ++i) {
      cmp1 = D[i];
      cmp2 = pow(distance(points[bestIdx], points[i]), 2);
      D[i] = cmp1 > cmp2 ? cmp2 : cmp1;
    }
  }

};

/* updates mean distance of cluster points to centroid */

var updateMeans = function () {

  for (var k = 0; k < ks; ++k) {
    var centroid = centroids[k];
    var sum_x = 0, sum_y = 0;
    for (var prop in centroid.data) {
      if (centroid.data.hasOwnProperty(prop)) {
        sum_x += centroid.data[prop].x;
        sum_y += centroid.data[prop].y;
      }
    }
    if (sum_x > 0 && sum_y > 0) {
      centroid.x = sum_x / centroid.items;
      centroid.y = sum_y / centroid.items;
    }
  }

};

/* updates distances of a point to all centroids */

var updateDistances = function () {

  for (var id = 0, ids = metas.length; id < ids; id++) {
    var c = metas[id];
    /* Update distances to means. */
    c.secondary = -1;
    for (var k = 0; k < ks; k++) {
      c.dists[k] = distance(c, centroids[k]);
      if (c.primary != k) {
        if (c.secondary < 0 || c.dists[k] < c.dists[c.secondary]) {
          c.secondary = k;
        }
      }
    }
  }

};

/* Transfer a single element from one cluster to another. */

var transfer = function (meta, dstnum) {

  /* remove element */
  delete centroids[meta.primary].data[meta.id];
  centroids[meta.primary].items--;

  /* add element */
  centroids[dstnum].data[meta.id] = meta;
  centroids[dstnum].items++;

  /* update to new centroid */
  meta.primary = dstnum;
  meta.item.k =  dstnum;

};

var initialAssignment = function () {

      /* Order points by the distance to their nearest cluster minus distance to the farthest cluster (= biggest
        benefit of best over worst assignment) */
  var compare = function (c1, c2) {
      return c2.priority() - c1.priority();
      }
      /* keep track of already assigned points */
    , assigned = []
    ;

  for (var start = 0, end = metas.length; start < end;) {

    var tids = metas.sort(compare);

    for (var id = 0, ids = tids.length; id < ids;) {

      var c = tids[id];

      if (assigned.indexOf(c.id) >= 0) {
        id++;
        continue;
      }

      /* Assigning to best cluster - which cannot be full yet! */
      var centroid = centroids[c.primary];
      centroid.data[c.id] = metas.id(c.id);
      c.item.k = c.primary;
      assigned.push(c.id);
      centroid.items++;
      start++;
      id++

      /* Now the cluster may have become completely filled: */
      if (centroid.items === maxsize) {
        //id++;
        var full = c.primary;
        /* Refresh the not yet assigned objects where necessary: */
        for (; id < ids; id++) {
          var ca = tids[id];
          if (ca.primary == full) {
            /* Update the best index: */
            for (var k = 0; k < ks; k++) {
              if (k === full || centroids[k].items >= maxsize)
                continue;
              if (ca.primary === full || ca.dists[k] < ca.dists[ca.primary])
                ca.primary = k;
            }
          }
        }
        /* The next iteration will perform the sorting */
        break;
      }
    }
    /* Note: we expect Candidate.a == cluster the object is assigned to! */
  }

};

/* Performs k-means style iterations to improve the clustering result. */

var refineResult = function () {

  /* Our desired cluster size: */
  var maxiter = -1
    , minsize = floor(ps / ks)
    , maxsize = ceil(ps / ks)
      /* Comparator: sort by largest gain by transfer */
    , comp = function (c1, c2) {
        return c1.priority() - c2.priority();
      }
    , sortByPreference = function (pref, meta) {
        return pref.sort(function (a, b) {
          return meta.dists[a] - meta.dists[b];
        })
      }
      /* List for sorting cluster preferences */
    , preferences = []
    ;

  /* Initialize pref. list. */
  for (var k = 0; k < ks; k++)
    preferences[k] = k;

  /* Initialize transfer lists. */
  var transfers = [];
  for (var k = 0; k < ks; k++)
    transfers[k] = {};

  transfers.count = function (k) {
    var transfer = this[k], count = 0;
    for (var prop in transfer) {
      if (transfer.hasOwnProperty(prop))
        count++;
    }
    return count;
  };

  for (var iter = 0; maxiter <= 0 || iter < maxiter; iter++) {

    updateDistances();
    metas.sort(comp);

    /* Track if anything has changed. */
    var active = 0;

    for (var m = 0, ms = metas.length; m < ms; m++) {

      var c = metas[m]
        , source = centroids[c.primary]
        , preferences = sortByPreference(preferences, c)
        , transferred = false
        ;

      for (var k = 0; k < ks; k++) {

        /*  Cannot transfer to the same cluster! */
        if(k == c.primary)
          continue;

        /* Can we pair this transfer? */
        var dest = centroids[k]
          , others = transfers[k]
          ;

        for (var other in others) {
          if (others.hasOwnProperty(other)) {
            var c2 = metas.id(other);
            /* is sum of swaping positive? */
            if (c.gain(k) + c2.gain(c.primary) > 0) {
              transfer(c2, c.primary);
              transfer(c, k);
              active += 2;
              transferred = true;
              delete others[other];
              break;
            }
          }
        }

        /* If cluster sizes allow, move a single object. */
        if (c.gain(k) > 0 && (dest.items < maxsize && source.items > minsize)) {
          transfer(c, k);
          active += 1;
          transferred = true;
          break;
        }

      }

      /* If the object would prefer a different cluster, put in outgoing transfer list. */
      if(!transferred && (c.dists[c.primary] > c.dists[c.secondary]))
        transfers[c.primary][c.id] = c;

    }

    /* Clear transfer lists for next iteration. */
    for(var k = 0; k < ks; k++)
      transfers[k] = {};

    if(active <= 0)
      break;

    /* Recompute means after reassignment. */
    updateMeans(centroids)

  }

};

/* returns total of squared differences */

var diffSum = function () {

  var sum = 0;
    for (var p = 0; p < ps; p++) {
      var point = points[p]
        , centroid = centroids[point.k]
        , dif_x = pow(point.x - centroid.x, 2)
        , dif_y = pow(point.y - centroid.y, 2)
        ;
      sum += dif_x + dif_y;
    }
  return sum;

};

/* kmeans w/o cluster size constaint */

var kmeans = function () {

  var converged = false;

  while (!converged) {

    var i;
    converged = true;

    /* Prepares the array of sums. */
    var sums = [];
    for (var k = 0; k < ks; k++)
      sums[k] = { x: 0, y: 0, items: 0 };

    /* Find the closest centroid for each point. */
    for (var p = 0; p < ps; ++p) {

      var distances = sortBy(centroids, function (centroid) {
          return distance(centroid, points[p]);
        });

      var closestItem = distances[0];
      var k = closestItem.k;

      /* When the point is not attached to a centroid or the point was attached to some other centroid before,
        the result differs from the previous iteration. */
      if (typeof points[p].k  !== 'number' || points[p].k !== k)
        converged = false;

      /* Attach the point to the centroid */
      points[p].k = k;

      /* Add the points' coordinates to the sum of its centroid */
      sums[k].x += points[p].x;
      sums[k].y += points[p].y;

      ++sums[k].items;
    }

    /* Re-calculate the center of the centroid. */
    for (var k = 0; k < ks; ++k) {
      if (sums[k].items > 0) {
        centroids[k].x = sums[k].x / sums[k].items;
        centroids[k].y = sums[k].y / sums[k].items;
      }
      centroids[k].items = sums[k].items;
    }
  }

};

var kmeansEqualSize = function () {

  initMetas();
  initialAssignment();
  updateMeans();
  refineResult();

};
// The best design to define the simple clustering
module.exports = Kmeans;
