let interpolate = require("./interpolate");

function distance(p1, p2) {
  let [ dx, dy ] = [ p2.x - p1.x, p2.y - p1.y ];

  return Math.sqrt((dx * dx) + (dy * dy));
}

function getTarget(e) {
  return (e ? e.target : null);
}

exports.near = function(data, x, y, r) {
  return getTarget(interpolate.coordinates(data).find(function(e) {
    return distance({ x: x, y: y }, e) < r;
  }));
}

exports.tangentNear = function(data, x, y, r) {
  return getTarget(interpolate.coordinates(data).find(function(e, i, c) {
    return (i < c.length - 1 && !c[i + 1].target.linear)
        && distance({ x: x - e.target.dx, y: y - e.target.dy }, e) < r;
  }));
}

exports.iTangentNear = function(data, x, y, r) {
  return getTarget(interpolate.coordinates(data).find(function(e, i, c) {
    return (i > 0 && !e.target.linear)
        && distance({ x: x + e.target.dx, y: y + e.target.dy }, e) < r;
  }));
}

exports.newCoordinates = function(data, element, x, y) {
  let dx = 0;
  let dy = 0;

  for (let i = 0; i < data.length; ++i) {
    if (data[i] === element) {
      if (data[i].absolute) {
        return [
          x || data[i].x + dx,
          y || data[i].y + dy,
        ];
      } else {
        return [
          (x || data[i].x) - dx,
          (y || data[i].y) - dy,
        ];
      }
    } else {
      if (data[i].absolute) {
        dx = data[i].x;
        dy = data[i].y;
      } else {
        dx += data[i].x;
        dy += data[i].y;
      }
    }
  }

  return [ x, y ];
}

exports.selected = function(data) {
  return data.find(function(e) {
    return (e.target ? e.target.selected : e.selected);
  });
}
