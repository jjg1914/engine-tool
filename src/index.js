document.addEventListener("DOMContentLoaded", function() {
  var data = [];
  var dataName = "";

  var dragging = false;

  var canvas = document.getElementById("stage");
  var t_input = document.getElementById("t_input");
  var x_input = document.getElementById("x_input");
  var y_input = document.getElementById("y_input");
  var dx_input = document.getElementById("dx_input");
  var dy_input = document.getElementById("dy_input");
  var linear_input = document.getElementById("linear_input");
  var absolute_input = document.getElementById("absolute_input");
  var export_input = document.getElementById("export_input");
  var import_input = document.getElementById("import_input");
  var export_action = document.getElementById("export_action");
  var remove_action = document.getElementById("remove_action");
  var new_action = document.getElementById("new_action");
  var ctx = canvas.getContext("2d");

  canvas.style.width = (canvas.width = 208) + "px";
  canvas.style.height = (canvas.height = 256) + "px";

  draw(ctx, data);

  canvas.addEventListener("mousedown", function(event) {
    var selected = select(data, event.offsetX, event.offsetY);
    if (selected) {
      dragging = true;
    }
    assignItem(selected);
    draw(ctx, data);
  });

  canvas.addEventListener("mousemove", function(event) {
    if (dragging) {
      assignItem(update(data, event.offsetX, event.offsetY));
    }
      draw(ctx, data);
  });

  canvas.addEventListener("mouseup", function(event) {
    dragging = false;
  });

  canvas.addEventListener("mouseleave", function(event) {
    dragging = false;
  });

  remove_action.addEventListener("click", function() {
    assignItem(remove(data));
    draw(ctx, data);
  });

  new_action.addEventListener("click", function() {
    data = [];
    dataName = "";
    assignItem();
    draw(ctx, data);
  });

  t_input.addEventListener("change",function(event) {
    updateItem(data, "t", Number(event.target.value));
    draw(ctx, data);
  });

  x_input.addEventListener("change", function(event) {
    updateItem(data, "x", Number(event.target.value));
    draw(ctx, data);
  });

  y_input.addEventListener("change", function(event) {
    updateItem(data, "y", Number(event.target.value));
    draw(ctx, data);
  });

  dx_input.addEventListener("change", function(event) {
    updateItem(data, "dx", Number(event.target.value));
    draw(ctx, data);
  });

  dy_input.addEventListener("change", function(event) {
    updateItem(data, "dy", Number(event.target.value));
    draw(ctx, data);
  });

  linear_input.addEventListener("change", function(event) {
    updateItem(data, "linear", event.target.checked);
    draw(ctx, data);
  });

  absolute_input.addEventListener("change", function(event) {
    updateItem(data, "absolute", event.target.checked);
    toggleAbsolute(data);
    draw(ctx, data);
  });

  export_input.addEventListener("change", function(event) {
    dataName = event.target.value;
  });

  import_input.addEventListener("change", function(event) {
    var reader = new FileReader();
    reader.onerror = function(err) { console.error(error); }
    reader.onload = function(result) {
      var raw = result.target.result;
      var str = String.fromCharCode.apply(null, new Uint8Array(raw));
      data = JSON.parse(str);
      assignItem();
      draw(ctx, data);
      export_input.value = dataName = event.target.files[0].name;
    }
    reader.readAsArrayBuffer(event.target.files[0]);
    // draw(ctx, data);
  });

  export_action.addEventListener("click", function(event) {
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([ json ], { type: "application/json;charset=utf-8"});
    
    var a = document.createElement("a");
    a.setAttribute("href", window.URL.createObjectURL(blob));
    a.setAttribute("download", dataName);
    a.click();
  });
});

function updateItem(data, prop, value) {
  var d = data.find(function(e) {
    return e.selected;
  });

  if (d) {
    d[prop] = value;
  }
}

function select(data, x, y) {
  let prevX = 0;
  let prevY = 0;

  var prev = data.find(function(e) {
    return e.selected;
  });

  var d = data.find(function(e) {
    if (e.absolute) {
      prevX = e.x;
      prevY = e.y;
    } else {
      prevX += e.x;
      prevY += e.y;
    }

    var dx = prevX - x;
    var dy = prevY - y;

    return Math.sqrt((dx * dx) + (dy * dy)) < 8;
  });

  prevX = 0;
  prevY = 0;

  var dtangent = data.find(function(e, i, c) {
    if (e.absolute) {
      prevX = e.x;
      prevY = e.y;
    } else {
      prevX += e.x;
      prevY += e.y;
    }

    if (i < c.length - 1 && !c[i + 1].linear) {
      var dx = prevX + e.dx - x;
      var dy = prevY + e.dy - y;

      return Math.sqrt((dx * dx) + (dy * dy)) < 8;
    } else {
      return false;
    }
  });

  prevX = 0;
  prevY = 0;

  var ditangent = data.find(function(e, i, c) {
    if (e.absolute) {
      prevX = e.x;
      prevY = e.y;
    } else {
      prevX += e.x;
      prevY += e.y;
    }

    if (i > 0 && !e.linear) {
      var dx = prevX - e.dx - x;
      var dy = prevY - e.dy - y;

      return Math.sqrt((dx * dx) + (dy * dy)) < 8;
    } else {
      return false;
    }
  });

  if (prev != null) {
    prev.selected = false
  }

  if (d != null) {
    d.selected = true;
  } else if (dtangent != null) {
    dtangent.selected = "tangent";
  } else if (ditangent != null) {
    ditangent.selected = "itangent";
  } else {
    if (prev == null) {
      let [ lastX, lastY ] = data.reduce(function(m, v) {
        if (v.absolute) {
          return [ v.x, v.y ];
        } else {
          return [ m[0] + v.x, m[1] + v.y ];
        }
      }, [ 0, 0 ]);

      d = {
        t: (data.length === 0 ? 0 : 1000),
        x: (data.length === 0 ? x : x - lastX ),
        y: (data.length === 0 ? y : y - lastY ),
        dx: 32,
        dy: 32,
        selected: true,
        absolute: false,
      };
      data.push(d);
    }
  }

  return d || dtangent || ditangent;
}

function update(data, x, y) {
  let prevX = 0;
  let prevY = 0;
  var d = data.find(function(e) {
    if (e.selected) {
      return true;
    } else {
      if (e.absolute) {
        prevX = e.x;
        prevY = e.y;
      } else {
        prevX += e.x;
        prevY += e.y;
      }

      return false;
    }
  });

  if (d) {
    let dx, dy;

    if (typeof d.selected == "boolean") {
      if (d.absolute) {
        dx = x;
        dy = y;
      } else {
        dx = x - prevX;
        dy = y - prevY;
      }

      d.x = dx;
      d.y = dy;
    } else if (typeof d.selected == "string") {
      if (d.absolute) {
        dx = d.x;
        dy = d.y;
      } else {
        dx = d.x + prevX;
        dy = d.y + prevY;
      }

      if (d.selected === "tangent") {
        d.dx = x - dx;
        d.dy = y - dy;
      } else if (d.selected === "itangent") {
        d.dx = -(x - dx);
        d.dy = -(y - dy);
      }
    }
  }

  return d;
}

function toggleAbsolute(data) {
  let prevX = 0;
  let prevY = 0;
  var d = data.find(function(e) {
    if (e.selected) {
      return true;
    } else {
      if (e.absolute) {
        prevX = e.x;
        prevY = e.y;
      } else {
        prevX += e.x;
        prevY += e.y;
      }

      return false;
    }
  });

  if (d) {
    if (d.absolute) {
      d.x = d.x + prevX;
      d.y = d.y + prevY;
    } else {
      d.x = d.x - prevX;
      d.y = d.y - prevY;
    }
  }
}

function remove(data) {
  var i;
  for (i = 0; i < data.length; ++i) {
    if (data[i].selected) {
      break;
    }
  }

  if (i < data.length) {
    data.splice(i, 1);
  }
}

function assignItem(e) {
  if (e) {
    document.getElementById("t_input").value = e.t;
    document.getElementById("x_input").value = e.x;
    document.getElementById("y_input").value = e.y;
    document.getElementById("dx_input").value = e.dx;
    document.getElementById("dy_input").value = e.dy;
    document.getElementById("linear_input").checked = e.linear;
    document.getElementById("absolute_input").checked = e.absolute;
    document.getElementById("remove_action").disabled = false;
  } else {
    document.getElementById("t_input").value = "";
    document.getElementById("x_input").value = "";
    document.getElementById("y_input").value = "";
    document.getElementById("dx_input").value = "";
    document.getElementById("dy_input").value = "";
    document.getElementById("linear_input").checked = false;
    document.getElementById("absolute_input").checked = false;
    document.getElementById("remove_action").disabled = true;
  }
}

function draw(ctx, data) {
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

  let prevX = null;
  let prevY = null;

  data.forEach(function(e, i, c) {
    ctx.strokeStyle = "#282828";

    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);

      let prev = c[i - 1]

      if (e.linear) {
        if (e.absolute) {
          ctx.lineTo(e.x, e.y);
          prevX = e.x;
          prevY = e.y;
        } else {
          ctx.lineTo(prevX + e.x, prevY + e.y);
          prevX += e.x;
          prevY += e.y;
        }
      } else {
        let res = 1 / 20;
        let x1 = prevX, y1 = prevY, x2, y2;

        if (e.absolute) {
          prevX = x2 = e.x;
          prevY = y2 = e.y;
        } else {
          prevX = x2 = prevX + e.x;
          prevY = y2 = prevY + e.y;
        }

        for (let t = res; t <= 1; t += res) {
          let h00 = (2 * t * t * t) - (3 * t * t) + 1;
          let h10 = (t * t * t) - (2 * t * t) + t;
          let h01 = (-2 * t * t * t) + (3 * t * t);
          let h11 = (t * t * t) - (t * t);

          let x = h00 * x1 + h10 * prev.dx
                  + h01 * x2 + h11 * e.dx;
          let y = h00 * y1 + h10 * prev.dy
                  + h01 * y2 + h11 * e.dy;

          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    } else {
      prevX = e.x;
      prevY = e.y;
    }

    if (i < c.length - 1 && !c[i + 1].linear) {
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(prevX + e.dx, prevY + e.dy);
      ctx.stroke();
    }

    if (i > 0 && !e.linear) {
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(prevX - e.dx, prevY - e.dy);
      ctx.stroke();
    }
  });

  prevX = 0;
  prevY = 0;

  data.forEach(function(e, i, c) {
    ctx.strokeStyle = "#282828";
    if (e.selected) {
      ctx.fillStyle = "#aeea1c";
    } else {
      ctx.fillStyle = "#00b6e4";
    }

    if (e.absolute) {
      prevX = e.x;
      prevY = e.y;
    } else {
      prevX += e.x;
      prevY += e.y;
    }

    ctx.beginPath();
    ctx.moveTo(prevX + 3, prevY);
    ctx.arc(prevX, prevY, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f33c6d";

    if (i < c.length - 1 && !c[i + 1].linear) {
      ctx.beginPath();
      ctx.moveTo(prevX + e.dx + 3, prevY + e.dy);
      ctx.arc(prevX + e.dx, prevY + e.dy, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    if (i > 0 && !e.linear) {
      ctx.beginPath();
      ctx.moveTo(prevX - e.dx + 3, prevY - e.dy);
      ctx.arc(prevX - e.dx, prevY - e.dy, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  });
}
