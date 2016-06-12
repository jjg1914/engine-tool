module.exports = function(data) {
  return module.exports.coordinates(data).reduce(function(m, v, i, c) {
    if (i === 0) {
      return m.concat([ [ v.x, v.y ] ]);
    } else {
      if (v.target.linear) {
        return m.concat([ [ v.x, v.y ] ]);
      } else {
        let res = 1 / 20;
        let points = []
        let prev = c[i - 1];

        for (let t = res; t <= 1; t += res) {
          let h00 = (2 * t * t * t) - (3 * t * t) + 1;
          let h10 = (t * t * t) - (2 * t * t) + t;
          let h01 = (-2 * t * t * t) + (3 * t * t);
          let h11 = (t * t * t) - (t * t);

          let x = h00 * prev.x + h10 * prev.target.dx
                  + h01 * v.x + h11 * v.target.dx;
          let y = h00 * prev.y + h10 * prev.target.dy
                  + h01 * v.y + h11 * v.target.dy;

          points.push([ x, y ]);
        }
        
        return m.concat(points);
      }
    }
  }, []);
}

module.exports.at = function(data, t) {
  let coordinates = module.exports.coordinates(data);
  let index = coordinates.findIndex(function(e) {
    return e.t > t;
  });

  if (index && index > 0) {
    let start = coordinates[index - 1];
    let end = coordinates[index];
    let nt = (t - start.t) / (end.t - start.t);

    if (end.target.linear) {
      let x = nt * (end.x - start.x) + start.x;
      let y = nt * (end.y - start.y) + start.y;

      return [ x, y ];
    } else {
      let h00 = (2 * nt * nt * nt) - (3 * nt * nt) + 1;
      let h10 = (nt * nt * nt) - (2 * nt * nt) + nt;
      let h01 = (-2 * nt * nt * nt) + (3 * nt * nt);
      let h11 = (nt * nt * nt) - (nt * nt);

      let x = h00 * start.x + h10 * start.target.dx
              + h01 * end.x + h11 * end.target.dx;
      let y = h00 * start.y + h10 * start.target.dy
              + h01 * end.y + h11 * end.target.dy;

      return [ x, y ];
    }
  } else {
    if (typeof index !== "number" || index < 0) {
      index = coordinates.length - 1;
    }

    return [ coordinates[index].x, coordinates[index].y ];
  }
}

module.exports.coordinates = function(data) {
  return data.reduce(function(m, v, i) {
    let t = v.t + (i > 0 ? m[m.length - 1].t : 0);

    if (v.absolute) {
      return m.concat([ { t: t, x: v.x , y: v.y, target: v } ]);
    } else {
      let prev = (i > 0 ? m[m.length - 1] : { x: 0, y: 0 });

      return m.concat([ { t: t, x: prev.x + v.x , y: prev.y + v.y, target: v } ]);
    }
  }, []);
};
