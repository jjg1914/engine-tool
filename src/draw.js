let interpolate = require("./interpolate");

exports.preview = function(ctx, data, t) {
  ctx.strokeStyle = "#282828";
  ctx.fillStyle = "#f33c6d";
  
  let [ x, y ] = interpolate.at(data, t);

  ctx.beginPath();
  ctx.moveTo(x + 6, y);
  ctx.arc(x, y, 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

exports.path = function(ctx, data) {
  ctx.strokeStyle = "#282828";
  ctx.beginPath();

  interpolate(data).forEach(function(e, i) {
    if (i === 0) {
      ctx.moveTo(e[0], e[1]);
    } else {
      ctx.lineTo(e[0], e[1]);
    }
  });

  ctx.stroke();
}

exports.tangents = function(ctx, data) {
  ctx.strokeStyle = "#282828";

  interpolate.coordinates(data).forEach(function(e, i, c) {
    ctx.beginPath();

    if (i > 0 && !e.target.linear) {
      ctx.moveTo(e.x - e.target.dx, e.y - e.target.dy);
    } else {
      ctx.moveTo(e.x, e.y);
    }

    if (i < c.length - 1 && !c[i + 1].target.linear) {
      ctx.lineTo(e.x + e.target.dx, e.y + e.target.dy);
    } else {
      ctx.lineTo(e.x, e.y);
    }

    ctx.stroke();
  });
}

exports.anchors = function(ctx, data) {
  interpolate.coordinates(data).forEach(function(e) {
    if (e.target.absolute) {
      ctx.fillStyle = "#282828";

      if (e.target.selected) {
        ctx.strokeStyle = "#aeea1c";
      } else {
        ctx.strokeStyle = "#00b6e4";
      }
    } else {
      ctx.strokeStyle = "#282828";

      if (e.target.selected) {
        ctx.fillStyle = "#aeea1c";
      } else {
        ctx.fillStyle = "#00b6e4";
      }
    }

    ctx.beginPath();
    ctx.moveTo(e.x + 3, e.y)
    ctx.arc(e.x, e.y, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  });
}

exports.tangentAnchors = function(ctx, data) {
  ctx.strokeStyle = "#282828";
  ctx.fillStyle = "#f33c6d";

  interpolate.coordinates(data).forEach(function(e, i, c) {
    if (i < c.length - 1 && !c[i + 1].target.linear) {
      ctx.beginPath();
      ctx.moveTo(e.x + e.target.dx + 3, e.y + e.target.dy);
      ctx.arc(e.x + e.target.dx, e.y + e.target.dy, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    if (i > 0 && !e.target.linear) {
      ctx.beginPath();
      ctx.moveTo(e.x - e.target.dx + 3, e.y - e.target.dy);
      ctx.arc(e.x - e.target.dx, e.y - e.target.dy, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  });
}

exports.background = function(ctx) {
  ctx.fillStyle = "#F8F8F8";
  ctx.strokeStyle = "#C8C8C8";

  ctx.fillRect(0, 0, 208, 256);

  for (let i = 8; i < 208; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
  }

  for (let i = 8; i < 256; i += 16) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(208, i);
    ctx.stroke();
  }
}
