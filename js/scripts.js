/**
 * Created by Itai Caspi on 26/07/2016.
 */


function assign(object, source) {
    Object.keys(source).forEach(function(key) {
        object[key] = source[key];
    });
}

/////////////////////////////////////////
//  Color


var Color = function(r, g, b, a) {
    if (typeof r == "object") {
        assign(this, r);
    } else {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
};

Color.prototype.to_string = function() {
    return "rgba(" +
        Math.round(this.r) + "," +
        Math.round(this.g) + "," +
        Math.round(this.b) + "," +
        this.a + ")";
};

var border_colors = [
    new Color(142, 68, 173, 1), // Purple
    new Color(52, 152, 219, 1), // Blue
    new Color(39, 174, 96, 1),  // Green
    new Color(241, 196, 15, 1), // Yellow
    new Color(230, 126, 34, 1), // Orange
    new Color(231, 76, 60, 1)   // Red
];

var fill_colors = [];
for (var i = 0; i < border_colors.length; i++) {
    var border_color = border_colors[i];
    var max_val = Math.max(Math.max(border_color.r, border_color.g), border_color.b);
    var fill_color = new Color(border_color.r + 0.5 * max_val, border_color.g + 0.5 * max_val, border_color.b + 0.5 * max_val, 0);
    fill_colors.push(fill_color);
}

/////////////////////////////////////////
//  Vertex - a 3D point in space

var Vertex = function (x, y, z, key) {
    if (y == undefined) {
        var vertex = x;
        this.x = vertex.x;
        this.y = vertex.y;
        this.z = vertex.z;
        this.key = vertex.key;
    } else {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        this.z = parseFloat(z);

        this.key = new Uint32Array(1);
        window.crypto.getRandomValues(this.key);
        this.key = (typeof key != 'undefined') ? key : this.key[0];
    }

};

Vertex.prototype.move_to = function(x,y,z) {
    this.x = x;
    this.y = y;
    this.z = z;
};


Vertex.prototype.translate = function(dx,dy,dz) {
    this.x += dx;
    this.y += dy;
    this.z += dz;
};

Vertex.prototype.normalize = function() {
    var vector = new Matrix([[this.x], [this.y], [this.z]]);
    vector.normalize();
    this.x = vector.elements[0][0];
    this.y = vector.elements[1][0];
    this.z = vector.elements[2][0];
    return this;
};

Vertex.prototype.norm = function() {
    return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2) + Math.pow(this.z,2))
};

Vertex.prototype.subtract = function(v) {
    return new Vertex(this.x - v.x, this.y - v.y, this.z - v.z);
};


Vertex.prototype.add = function(v) {
    return new Vertex(this.x + v.x, this.y + v.y, this.z + v.z);
};

Vertex.prototype.mul = function(s) {
    return new Vertex(this.x*s, this.y*s, this.z*s);
};

Vertex.prototype.dot = function(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
};

Vertex.prototype.cross = function(v) {
    return new Vertex(this.y * v.z - v.y * this.z, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
};

Vertex.prototype.log = function() {
    console.log(this.x + "," + this.y + "," + this.z);
};

Vertex.prototype.toMatrix = function() {
    return new Matrix([[this.x],[this.y],[this.z]]);
};

function unit_vector(p1, p2) {
    return new Vertex(p2.x - p1.x, p2.y - p1.y, 0).normalize();
}

function point_is_on_line_between_two_points(p, v1, v2, allowed_error) {
    var x = p.x;
    var y = p.y;
    // check between points
    if (((y <= v1.y + allowed_error && y >= v2.y) || (y >= v1.y - allowed_error && y <= v2.y + allowed_error)) &&
        ((x <= v1.x + allowed_error && x >= v2.x - allowed_error) || (x >= v1.x - allowed_error && x <= v2.x + allowed_error))) {
        // vertical lines
        if (v1.x == v2.x && (x <= v1.x + allowed_error) && (x >= v1.x - allowed_error)) {
            return true;
        } else {
            // the slope of the line between the two points
            var m = (v2.y - v1.y) / (v2.x - v1.x);
            // the distance between the third point and the line
            var a = -m;
            var c = -v1.y+m*v1.x;
            var dist = Math.abs(a*x+y+c) / Math.sqrt(a*a+1);
            if (dist <= allowed_error) return true;
        }
    }

    return false;
}

function direction_of_line_between_two_points(v1, v2, allowed_error) {
    if (Math.abs(v1.y - v2.y) <= allowed_error) {
        return "horizontal";
    } else if (Math.abs(v1.x - v2.x) <= allowed_error) {
        return "vertical";
    }
    return "diagonal";
}

function color_under_cursor_matches_given_color(color, ctx, p, allowed_error) {
    var pixelColor = ctx.getImageData(p.x - allowed_error, p.y - allowed_error, allowed_error*2, allowed_error*2).data;
    for (var i = 0; i < 4*allowed_error*allowed_error; i++) {
        if (pixelColor[i*3] == color.r && pixelColor[i*3+1] == color.g && pixelColor[i*3+2] == color.b) {
            return true;
        }
    }
    return false;
}

function relative_position_on_the_line_between_two_points(v1,v2,p) {
    if (Math.abs(v2.y - v1.y) > Math.abs(v2.x - v1.x)) {
        return Math.abs((v2.y-p.y)/(v2.y-v1.y));
    } else {
        return Math.abs((v2.x-p.x)/(v2.x-v1.x));
    }
}

/////////////////////////////////////////
// Matrix

var Matrix = function(elements) {
    this.rows = elements.length;
    this.cols = elements[0].length;
    this.elements = elements;
};

Matrix.prototype.dot = function(matrix) {
    var result = [];
    var isVertex = (matrix.constructor.name == "Vertex");
    if (isVertex) matrix = matrix.toMatrix();
    if (this.cols != matrix.rows) throw "Shared side length does not match";
    for (var i = 0; i < this.rows; i++) {
        result.push([]);
        for (var j = 0; j < matrix.cols; j++) {
            var val = 0;
            for (var k = 0; k < this.cols; k++) {
                val += this.elements[i][k] * matrix.elements[k][j];
            }
            result[i].push(val);
        }
    }
    if (isVertex) return new Vertex(result[0][0], result[1][0], result[2][0]);
    return new Matrix(result);
};

Matrix.prototype.normalize = function() {
    var sum = 0;
    for (var i = 0; i < this.rows; i++) {
        for (var j = 0; j < this.cols; j++) {
            sum += Math.pow(this.elements[i][j],2);
        }
    }
    var normalizer = Math.sqrt(sum);
    for (var i = 0; i < this.rows; i++) {
        for (var j = 0; j < this.cols; j++) {
            this.elements[i][j] /= normalizer;
        }
    }
    this.normalizer = normalizer;
};
/**
 * Created by Itai Caspi on 28/07/2016.
 */


function object_to_shape(obj) {
    var classes = {
        "Rectangle": Rectangle,
        "Triangle": Triangle,
        "Diamond": Diamond,
        "Circle": Circle,
        "Hexagon": Hexagon,
        "Line": Line
    };
    for (var key in classes) {
        if (obj.type == key) {
            return new classes[key](obj);
        }
    }
}

var inheritsFrom = function (child, parent) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
};

var Line = function(vertices, radius, color, stroke, key) {
    if (stroke == undefined) {
        // copy constructor
        var shape = vertices;
        var linkStart = radius;
        var linkEnd = color;
        assign(this, shape);
        this.vertices = [];
        for (var i = 0; i < shape.vertices.length; i++) {
            this.vertices.push(new Vertex(shape.vertices[i]));
        }
        this.linkStart.shape = linkStart;
        this.linkEnd.shape = linkEnd;
        this.default_color = new Color(shape.color);
        this.color = new Color(shape.color);
        this.border_color = new Color(shape.color);

        this.key = shape.key;
    } else {
        this.vertices = vertices;
        this.default_color = color;
        this.color = color;
        this.border_color = color;
        this.stroke = (typeof stroke != 'undefined') ? stroke : 1;
        this.radius = (typeof radius != 'undefined') ? radius : 2;
        this.points = 0;
        this.linkStart = {};
        this.linkEnd = {};
        this.startDir = [];
        this.endDir = [];
        this.broken_start = false;
        this.broken_end = false;
        this.type = "Line";

        this.key = new Uint32Array(1);
        window.crypto.getRandomValues(this.key);
        this.key = (typeof key != 'undefined') ? key : this.key[0];
    }
};

Line.prototype.clone = function() {
    return new Line(this, this.linkStart.shape, this.linkEnd.shape);
};


Line.prototype.has_border_line = function(line_points) {
    var i;
    for (i = 0; i < this.vertices.length; i++) {
        var vi = this.vertices[i];
        var vj = this.vertices[(i + 1) % this.vertices.length];
        if (vi.key == line_points.p1.key && vj.key == line_points.p2.key) {
            return true;
        }
    }
    return false;
};

Line.prototype.shapes_are_linked = function(shapes) {
	var is_start = false;
	var is_end = false;
	for (var i = 0; i < shapes.length; i++) {
	    if (Object.keys(this.linkStart).length > 0 && shapes[i].has_border_line(this.linkStart)) {
            is_start = shapes[i];
        }
        if (Object.keys(this.linkEnd).length > 0 && shapes[i].has_border_line(this.linkEnd)) {
            is_end = shapes[i];
        }
	}
	return [is_start, is_end]
};


Line.prototype.linked_shapes_moved = function(dx, dy, shapes) {
	var results = this.shapes_are_linked(shapes);
	var start_moved = results[0];
	var end_moved = results[1];

    if (start_moved && end_moved) {//} && start_moved.type != "Line" && end_moved.type != "Line") {
        this.move(dx,dy);
    }
    if (start_moved) {
        this.linkStart.p1 = start_moved.get_vertex_by_key(this.linkStart.p1.key);
        this.linkStart.p2 = start_moved.get_vertex_by_key(this.linkStart.p2.key);
        this.sync_start();
    }

    if (end_moved) {
        this.linkEnd.p1 = end_moved.get_vertex_by_key(this.linkEnd.p1.key);
        this.linkEnd.p2 = end_moved.get_vertex_by_key(this.linkEnd.p2.key);
        this.sync_end();
    }

    this.sync_start();
    this.sync_end();
};

Line.prototype.linked_shape_color_change = function(shape, arrows) {
    if (shape.has_border_line(this.linkStart)) {
        this.color = shape.border_color;
        this.border_color = shape.border_color;
        this.default_color = shape.border_color;
        for (var a = 0; a < arrows.length; a++) {
            arrows[a].linked_shape_color_change(this, arrows);
        }
    }
};

Line.prototype.start_line = function(start, color, linkStart) {
    // linkStart is an array of 2 points and a type
    this.points++;
    this.vertices[0] = start;
    this.color = color;
    this.border_color = color;
    this.linkStart = linkStart;
	this.startDir = direction_of_line_between_two_points(linkStart.p1, linkStart.p2, 0);
	this.sync_start();
};

Line.prototype.add_point = function(point) {
    var lastIdx = this.points-1;
    if (this.points == 1) {
        if (this.startDir == "horizontal" || (this.startDir == true && Math.abs(point.x - this.vertices[lastIdx].x) < Math.abs(point.y - this.vertices[lastIdx].y))) {
            this.vertices[this.points] = new Vertex(this.vertices[lastIdx].x, point.y, 0);
        } else {
            this.vertices[this.points] = new Vertex(point.x, this.vertices[lastIdx].y, 0);
        }
    } else if (this.points > 1) {
        if (this.vertices[lastIdx].y == this.vertices[lastIdx-1].y) {
            this.vertices[this.points] = new Vertex(this.vertices[lastIdx].x, point.y, 0);
        } else {
            this.vertices[this.points] = new Vertex(point.x, this.vertices[lastIdx].y, 0);
        }
    }
};

Line.prototype.end_line = function(end, linkEnd) {
    var lastIdx = this.points-1;
    var error_allowed = 10;
    // close a line
    if (Math.abs(this.vertices[lastIdx].y - end.y) > error_allowed || Math.abs(this.vertices[lastIdx].x - end.x) > error_allowed) {
        if (this.vertices[lastIdx].y == this.vertices[lastIdx-1].y) {
            this.vertices[lastIdx+1] = new Vertex(this.vertices[lastIdx].x, end.y, 0);
        } else {
            this.vertices[lastIdx+1] = new Vertex(end.x, this.vertices[lastIdx].y, 0);
        }
    } else if (this.points > 2) {
        this.points--;
    } else {
        linkEnd.dist = relative_position_on_the_line_between_two_points(linkEnd.p1, linkEnd.p2, this.vertices[lastIdx]);
    }
    this.points = this.vertices.length;
    lastIdx = this.points-1;
    this.endDir = direction_of_line_between_two_points(this.vertices[lastIdx], this.vertices[lastIdx-1], 0);
    this.linkEnd = linkEnd;
    this.sync_end();
};


Line.prototype.draw = function(ctx) {

    if (this.vertices.length == 0) return;
    var horizontal, vertical, over, offset;
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (var v = 1; v < this.vertices.length; v++) {
        var last = (v == this.vertices.length - 1);
        horizontal = (this.vertices[v].y == this.vertices[v-1].y);
        vertical = (this.vertices[v].x == this.vertices[v-1].x);
        over = (horizontal && this.vertices[v].x >= this.vertices[v-1].x) || (vertical && this.vertices[v].y >= this.vertices[v-1].y);
        offset = (over ? -this.radius : this.radius);
        if (this.vertices[v].subtract(this.vertices[v-1]).norm() < this.radius) {
            offset*=0.1;
        }
        if (horizontal) {
            if (v > 1) ctx.quadraticCurveTo(this.vertices[v-1].x, this.vertices[v-1].y, this.vertices[v-1].x - offset, this.vertices[v-1].y);
            ctx.lineTo(this.vertices[v].x + (last ? 0 : offset), this.vertices[v].y);
        } else if (vertical) {
            if (v > 1) ctx.quadraticCurveTo(this.vertices[v-1].x, this.vertices[v-1].y, this.vertices[v-1].x, this.vertices[v-1].y - offset);
            ctx.lineTo(this.vertices[v].x, this.vertices[v].y + (last ? offset : offset));
        }
    }

    // draw border
    if (this.stroke > 0) {
        // draw border to distinguish between intersecting lines
        // TODO: disable this when saving images
        ctx.strokeStyle = "#EBECED";
        ctx.lineWidth = this.stroke + 6;
        ctx.stroke();
        // draw line
        ctx.strokeStyle = this.border_color.to_string();
        ctx.lineWidth = this.stroke;
        ctx.stroke();
    }

    //TODO:
    // for (var v = 0; v < this.vertices.length; v++) {
    //     ctx.beginPath();
    //     ctx.arc(this.vertices[v].x, this.vertices[v].y, 5, 0, 2 * Math.PI, false);
    //     ctx.fillStyle = this.border_color.to_string();
    //     ctx.fill();
    // }

    ctx.beginPath();
    ctx.moveTo(this.vertices[this.vertices.length-1].x, this.vertices[this.vertices.length-1].y);
    if (horizontal) {
        ctx.lineTo(this.vertices[this.vertices.length-1].x + offset * 2, this.vertices[this.vertices.length-1].y+5);
        ctx.lineTo(this.vertices[this.vertices.length-1].x + offset * 2, this.vertices[this.vertices.length-1].y-5);
    } else if (vertical) {
        ctx.lineTo(this.vertices[this.vertices.length-1].x+5, this.vertices[this.vertices.length-1].y + offset * 2);
        ctx.lineTo(this.vertices[this.vertices.length-1].x-5, this.vertices[this.vertices.length-1].y + offset * 2);
    }
    ctx.closePath();
    ctx.fillStyle = this.border_color.to_string();
    ctx.fill();

    if (this.linkStart.shape.type == "Line") {
        ctx.beginPath();
        ctx.arc(this.vertices[0].x, this.vertices[0].y, 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = this.border_color.to_string();
        ctx.fill();
    }
};

Line.prototype.move = function(dx, dy) {
	for (var v = 0; v < this.vertices.length; v++) {
		this.vertices[v].translate(dx,dy,0);
	}
};

Line.prototype.translate = function(dx,dy) {
    this.move(dx,dy);
};

Line.prototype.update_vertices = function(reverse) {
    var startDir;
    if (this.endDir == "vertical" && this.points % 2 == 1) startDir = "horizontal";
    else if (this.endDir == "vertical" && this.points % 2 == 0) startDir = "vertical";
    else if (this.endDir == "horizontal" && this.points % 2 == 1) startDir = "vertical";
    else if (this.endDir == "horizontal" && this.points % 2 == 0) startDir = "horizontal";

    if (reverse) {
        for (var v = 1; v < this.vertices.length; v++) {
            if ((startDir == "horizontal" && v % 2 == 0) || (startDir == "vertical" && v % 2 == 1)) {
                this.vertices[v-1].x = this.vertices[v].x;
            } else {
                this.vertices[v-1].y = this.vertices[v].y;
            }
        }
    } else {
        for (var v = 1; v < this.vertices.length; v++) {
            if ((startDir == "horizontal" && v % 2 == 0) || (startDir == "vertical" && v % 2 == 1)) {
                this.vertices[v].x = this.vertices[v-1].x;
            } else {
                this.vertices[v].y = this.vertices[v-1].y;
            }
        }
    }

    // remove groups of 3 vertices lying on the same line
    for (var v = this.vertices.length-1; v >= 2; v--) {
        if (this.broken_start && v <= 4) break;
        if (this.broken_end && v >= this.vertices.length-5) continue;
        if (this.vertices.length > 3) {
            if ((this.vertices[v-2].x == this.vertices[v-1].x && this.vertices[v-1].x == this.vertices[v].x) ||
                (this.vertices[v-2].y == this.vertices[v-1].y && this.vertices[v-1].y == this.vertices[v].y)) {
                this.vertices.splice(v-2,2);
            }
        }
    }

    this.points = this.vertices.length;
};

Line.prototype.move_start = function(dx, dy) {
    var startDir;
    if (this.endDir == "vertical" && this.points % 2 == 1) startDir = "horizontal";
    else if (this.endDir == "vertical" && this.points % 2 == 0) startDir = "vertical";
    else if (this.endDir == "horizontal" && this.points % 2 == 1) startDir = "vertical";
    else if (this.endDir == "horizontal" && this.points % 2 == 0) startDir = "horizontal";

    if (this.linkStart.p2 == undefined) return;
    var new_x = this.linkStart.p2.x - (this.linkStart.p2.x - this.linkStart.p1.x) * this.linkStart.dist;
    var new_y = this.linkStart.p2.y - (this.linkStart.p2.y - this.linkStart.p1.y) * this.linkStart.dist;

    // wrapping the arrow around the shape
    if (this.vertices.length > 1 && (!this.broken_end || this.vertices != 6)) {
        if (startDir == "vertical") {
            var sign_y = (this.vertices[1].y+dy - new_y > 0 ? 1 : -1);
            if (!this.broken_start) {
                // detect if line break needed
                if (this.linkStart.shape.type != "Line" && this.linkStart.shape.pointer_is_inside(new_x, 20*sign_y + new_y)) {
                    this.vertices[0].y = new_y;
                    this.vertices[1].y = new_y - sign_y*20;
                    var mid_point = this.vertices[2].add(this.vertices[1]).mul(0.5);
                    this.vertices.splice(2, 0, new Vertex(mid_point.x, this.vertices[1].y, 0));
                    this.vertices.splice(3, 0, new Vertex(mid_point.x, this.vertices[3].y, 0));
                    this.broken_start = true;
                    this.update_vertices();
                    return;
                }
            } else {
                // update the vertices
                this.vertices[2].translate(0,dy,0);
                this.vertices[1].translate(dx,dy,0);
                this.vertices[0].translate(dx,dy,0);

                // detect if line break not needed anymore
                if ((this.vertices[2].y - this.vertices[3].y)*sign_y <= 0) {
                    this.broken_start = false;
                    this.vertices.splice(2,2);
                    this.update_vertices(true);
                }
                return;
            }
        } else if (startDir == "horizontal") {
            var sign_x = (this.vertices[1].x +dx - new_x > 0 ? 1 : -1);
            if (!this.broken_start) {
                if (this.linkStart.shape.type != "Line" && this.linkStart.shape.pointer_is_inside(20*sign_x + new_x, new_y)) {
                    this.vertices[0].x = new_x;
                    this.vertices[1].x = new_x - sign_x*20;
                    var mid_point = this.vertices[2].add(this.vertices[1]).mul(0.5);
                    this.vertices.splice(2, 0, new Vertex(this.vertices[1].x, mid_point.y, 0));
                    this.vertices.splice(3, 0, new Vertex(this.vertices[3].x, mid_point.y, 0));
                    this.broken_start = true;
                    this.update_vertices();
                    return;
                }
            } else {
                this.vertices[2].translate(dx,0,0);
                this.vertices[1].translate(dx,dy,0);
                this.vertices[0].translate(dx,dy,0);

                if ((this.vertices[2].x - this.vertices[3].x)*sign_x <= 0) {
                    this.broken_start = false;
                    this.vertices.splice(2,2);
                    this.update_vertices(true);
                }
                return;
            }
        }

    }

    if (this.points > 2) {
        // just move the arrow
        if (startDir == "vertical") this.vertices[1].translate(dx,0,0);
        if (startDir == "horizontal") this.vertices[1].translate(0,dy,0);
        this.vertices[0].translate(dx,dy,0);
        this.update_vertices();
    } else if (this.points == 2) {
        // break the arrow and move it
        var newVertices = this.vertices;
        var midX, midY;
        if (this.endDir == "horizontal" && dy != 0) {
            midX = (this.vertices[0].x + this.vertices[1].x) / 2;
            newVertices = [this.vertices[0], new Vertex(midX, this.vertices[0].y, 0),
                new Vertex(midX, this.vertices[1].y, 0), this.vertices[1]];
        } else if (this.endDir == "vertical" && dx != 0) {
            midY = (this.vertices[0].y + this.vertices[1].y) / 2;
            newVertices = [this.vertices[0], new Vertex(this.vertices[0].x, midY, 0),
                new Vertex(this.vertices[1].x, midY, 0), this.vertices[1]];
        } else {
            this.vertices[0].translate(dx,dy,0);
        }
        this.vertices = newVertices;
        this.points = this.vertices.length;
        // this.update_vertices();
    }
};

Line.prototype.move_end = function(dx, dy) {
    var last = this.vertices.length-1;

    if (this.linkEnd.p2 == undefined) return;
    var new_x = this.linkEnd.p2.x - (this.linkEnd.p2.x - this.linkEnd.p1.x) * this.linkEnd.dist;
    var new_y = this.linkEnd.p2.y - (this.linkEnd.p2.y - this.linkEnd.p1.y) * this.linkEnd.dist;

    // wrapping the arrow around the shape
    if (this.vertices.length > 1) {
        if (this.endDir == "vertical") {
            var sign_y = (this.vertices[last-1].y + dy - new_y > 0 ? 1 : -1);
            if (!this.broken_end) {
                // detect if line break needed
                if (this.linkStart.shape.type != "Line" && this.linkEnd.shape.pointer_is_inside(new_x, 20*sign_y+new_y)) {
                    this.vertices[last].y = new_y;
                    this.vertices[last-1].y = new_y - sign_y * 20;
                    var mid_point = this.vertices[last-2].add(this.vertices[last-1]).mul(0.5);
                    this.vertices.splice(last-1, 0, new Vertex(mid_point.x, this.vertices[last-2].y, 0));
                    this.vertices.splice(last-1, 0, new Vertex(mid_point.x, this.vertices[last-1].y, 0));
                    this.broken_end = true;
                    this.update_vertices(true);
                    return;
                }
            } else {
                // update the vertices
                this.vertices[last-2].translate(0, dy, 0);
                this.vertices[last-1].translate(dx, dy, 0);
                this.vertices[last].translate(dx, dy, 0);

                // detect if line break not needed anymore
                if ((this.vertices[last-2].y - this.vertices[last-3].y) * sign_y <= 0) {
                    this.broken_end = false;
                    this.vertices.splice(last-3, 2);
                    this.update_vertices();
                }
                return;
            }
        } else if (this.endDir == "horizontal") {
            var sign_x = (this.vertices[last-1].x + dx - this.vertices[last].x > 0 ? 1 : -1);
            if (!this.broken_end) {
                if (this.linkStart.shape.type != "Line" && this.linkEnd.shape.pointer_is_inside(new_x + sign_x*20, new_y)) {
                    this.vertices[last].x = new_x;
                    this.vertices[last-1].x = new_x - sign_x * 20;
                    var mid_point = this.vertices[last-2].add(this.vertices[last-1]).mul(0.5);
                    this.vertices.splice(last-1, 0, new Vertex(this.vertices[last-2].x, mid_point.y, 0));
                    this.vertices.splice(last-1, 0, new Vertex(this.vertices[last-1].x, mid_point.y, 0));
                    this.broken_end = true;
                    this.update_vertices(true);
                    return;
                }
            } else {
                this.vertices[last-2].translate(dx, 0, 0);
                this.vertices[last-1].translate(dx, dy, 0);
                this.vertices[last].translate(dx, dy, 0);

                if ((this.vertices[last-2].x - this.vertices[last-3].x) * sign_x <= 0) {
                    this.broken_end = false;
                    this.vertices.splice(last - 3, 2);
                    this.update_vertices();
                }
                return;
            }
        }
    }
    // if (this.points == 6 && this.broken_start && this.vertices[last].subtract(this.vertices[last-1]).norm() < 20) {
    //     this.vertices[last-2].translate(0, dy, 0);
    //     this.vertices[last-1].translate(dx, dy, 0);
    //     this.vertices[last].translate(dx, dy, 0);
    //     return;
    // }
    if (this.points > 2 || (this.endDir == "horizontal" && dy == 0) || (this.endDir == "vertical" && dx == 0)) {
        if (this.endDir == "vertical") this.vertices[last - 1].translate(dx,0,0);
        if (this.endDir == "horizontal") this.vertices[last - 1].translate(0,dy,0);
        this.vertices[last].translate(dx,dy,0);

        this.update_vertices();
    } else if (this.points == 2) {
        var newVertices = this.vertices;
        var midX, midY;
        if (this.endDir == "horizontal" && dy != 0) {
            midX = (this.vertices[0].x + this.vertices[1].x) / 2;
            newVertices = [this.vertices[0], new Vertex(midX, this.vertices[0].y, 0),
                new Vertex(midX, this.vertices[1].y, 0), this.vertices[1]];
        } else if (this.endDir == "vertical" && dx != 0) {
            midY = (this.vertices[0].y + this.vertices[1].y) / 2;
            newVertices = [this.vertices[0], new Vertex(this.vertices[0].x, midY, 0),
                new Vertex(this.vertices[1].x, midY, 0), this.vertices[1]];
        } else {
            this.vertices[0].translate(dx,dy,0);
        }
        this.vertices = newVertices;
        this.points = this.vertices.length;
    }

};

Line.prototype.sync_start = function() {
    var new_x = this.linkStart.p2.x - (this.linkStart.p2.x - this.linkStart.p1.x) * this.linkStart.dist;
    var new_y = this.linkStart.p2.y - (this.linkStart.p2.y - this.linkStart.p1.y) * this.linkStart.dist;
    this.move_start(new_x - this.vertices[0].x, new_y - this.vertices[0].y);
};

Line.prototype.sync_end = function() {
    var new_x = this.linkEnd.p2.x - (this.linkEnd.p2.x - this.linkEnd.p1.x) * this.linkEnd.dist;
    var new_y = this.linkEnd.p2.y - (this.linkEnd.p2.y - this.linkEnd.p1.y) * this.linkEnd.dist;
    this.move_end(new_x - this.vertices[this.vertices.length-1].x, new_y - this.vertices[this.vertices.length-1].y);
};


Line.prototype.pointer_is_on_the_border = function(xm, ym, ctx) {
    var cursor = new Vertex(xm, ym, 0);
    // check if the pointer position is relevant by comparing the color under the cursor with the color of the line
    if (!color_under_cursor_matches_given_color(this.border_color, ctx, cursor,this.stroke)) return false;

    // go over all parts of the line and check if the pointer is on them
    for (var i = 0; i < this.vertices.length; i++) {
        var vi = this.vertices[i];
        var vj = this.vertices[(i + 1) % this.vertices.length];
        if (point_is_on_line_between_two_points(cursor,vi,vj,this.stroke)) {
            return direction_of_line_between_two_points(vi,vj,this.stroke);
        }
    }
    return false;
};

Line.prototype.pointer_is_on_the_border_line = function(xm, ym, ctx) {
    var cursor = new Vertex(xm, ym, 0);
    // check if the pointer position is relevant by comparing the color under the cursor with the color of the line
    if (!color_under_cursor_matches_given_color(this.border_color, ctx, cursor,this.stroke)) return false;

    // go over all lines of the border and check if the pointer is on them
    for (var i = 0; i < this.vertices.length; i++) {
        var vi = this.vertices[i];
        var vj = this.vertices[(i + 1) % this.vertices.length];
        if (point_is_on_line_between_two_points(cursor,vi,vj,this.stroke)) {
            var dist = relative_position_on_the_line_between_two_points(vi, vj, cursor);
            return {p1: vi, p2: vj, dist: dist};
        }
    }
    return false;
};

Line.prototype.pointer_is_on_end = function(xm, ym, ctx) {
    var pointer = new Vertex(xm, ym, 0);
    var dist = pointer.subtract(this.vertices[this.vertices.length-1]).norm();
    var radius = 5; //px
    return dist < radius;
};


Line.prototype.get_vertex_by_key = function(key) {
    for (var i = 0; i < this.vertices.length; i++) {
        if (this.vertices[i].key == key) {
            return this.vertices[i];
        }
    }
};

//////////////////////////////////
//  Shape

var Shape = function(x, y, width, height, radius, stroke, text, color, border_color, dashedBorder, key, offset) {
    if (typeof x == "object") {
        assign(this, x);
        this.default_color = new Color(this.default_color);
        this.color = new Color(this.color);
        this.default_border_color = new Color(this.default_border_color);
        this.border_color = new Color(this.border_color);
        this.set_layer(this.layer);
    } else {
        this.x = x;
        this.y = y;
        this.baseWidth = width;
        this.width = width;
        this.height = height;
        this.radius = (typeof radius != 'undefined') ? radius : 2;
        this.stroke = (typeof stroke != 'undefined') ? stroke : 1;
        this.textColor = "rgb(50,50,50)";
        this.default_color = new Color(color);
        this.color = new Color(color);
        this.default_border_color = new Color(border_color);
        this.border_color = new Color(border_color);
        this.vertices = [];
        this.dashedBorder = (typeof dashedBorder != 'undefined') ? dashedBorder : false;
        this.offset = (typeof offset != 'undefined') ? offset : 0;
        this.update_text((typeof text != 'undefined') ? text : "");

        this.key = (typeof key != 'undefined') ? key : this.generate_new_key();

        this.set_layer(new Layer());
        this.full_details = false;
    }

};

Shape.prototype.generate_new_key = function() {
    this.key = new Uint32Array(1);
    window.crypto.getRandomValues(this.key);
    return this.key[0];
};

Shape.prototype.set_layer = function(layer) {
    if (layer.type == "Convolution") {
        this.layer = new Convolution(layer);
    } else if (layer.type == "InnerProduct") {
        this.layer = new InnerProduct(layer);
    } else if (layer.subtype == "LocalResponseNormalization") {
        this.layer = new LRN(layer);
    } else {
        this.layer = layer;
    }
};


Shape.prototype.clone = function() {
    var shape = object_to_shape(this);
    shape.key = shape.generate_new_key();
    shape.vertices = [];
    shape.update_vertices();
    return shape;
};

Shape.prototype.has_border_line = function(line_points) {
    var i;
    for (i = 0; i < this.vertices.length; i++) {
        var vi = this.vertices[i];
        var vj = this.vertices[(i + 1) % this.vertices.length];
        if (vi.key == line_points.p1.key && vj.key == line_points.p2.key) {
            return true;
        }
    }
    return false;
};

Shape.prototype.pointer_is_inside = function(xm, ym) {
    console.log("hello");
    var j = this.vertices.length-1;
    var oddNodes = false;

    for (var i = 0; i < this.vertices.length; i++) {
        var vi = this.vertices[i];
        var vj = this.vertices[j];
        if ((vi.y < ym && vj.y >= ym || vj.y < ym && vi.y >= ym) && (vi.x <= xm || vj.x <= xm)) {
            if (vi.x + (ym - vi.y)/(vj.y-vi.y)*(vj.x - vi.x) < xm) {
                oddNodes = !oddNodes;
            }
        }
        j = i;
    }

    return oddNodes;
};


Shape.prototype.pointer_is_on_the_border = function(xm, ym, ctx) {
    var cursor = new Vertex(xm, ym, 0);
    // check if the pointer position is relevant by comparing the color under the cursor with the color of the line
    if (!color_under_cursor_matches_given_color(this.border_color, ctx, cursor,this.stroke)) return false;

    // go over all lines of the border and check if the pointer is on them
    for (var i = 0; i < this.vertices.length; i++) {
        var vi = this.vertices[i];
        var vj = this.vertices[(i + 1) % this.vertices.length];
        if (point_is_on_line_between_two_points(cursor,vi,vj,this.stroke)) {
            return direction_of_line_between_two_points(vi,vj,this.stroke);
        }
    }
    return false;
};


Shape.prototype.pointer_is_on_the_border_line = function(xm, ym, ctx) {
    var cursor = new Vertex(xm, ym, 0);
    // check if the pointer position is relevant by comparing the color under the cursor with the color of the line
    if (!color_under_cursor_matches_given_color(this.border_color, ctx, cursor,this.stroke)) return false;

    // go over all lines of the border and check if the pointer is on them
    for (var i = 0; i < this.vertices.length; i++) {
        var vi = this.vertices[i];
        var vj = this.vertices[(i + 1) % this.vertices.length];
        if (point_is_on_line_between_two_points(cursor,vi,vj,this.stroke)) {
            var dist = relative_position_on_the_line_between_two_points(vi, vj, cursor);
            return {p1: vi, p2: vj, dist: dist};
        }
    }
    return false;
};

Shape.prototype.update_vertices = function() {

};


Shape.prototype.move_to = function(x, y) {
    this.translate(x - this.x, y - this.y);
};

Shape.prototype.translate = function(dx, dy) {
    for (var i = 0; i < this.vertices.length; i++) {
        this.vertices[i].translate(dx,dy,0);
    }
    this.x += dx;
    this.y += dy;
};

Shape.prototype.update_text = function(text) {
    var textWidth = text.length * 7;
    this.text = text;
    if (textWidth > this.baseWidth) {
        this.width = textWidth;
    } else {
        this.width = this.baseWidth;
    }
    this.update_vertices();
};

Shape.prototype.hide = function() {
    this.color.a = 0;
	this.border_color.a = 0;
};

Shape.prototype.show = function() {
    this.color.a = this.default_color.a;
	this.border_color.a = this.default_border_color.a;
};

Shape.prototype.change_color = function(color) {
    this.color = new Color(this.default_color);
	this.border_color = new Color(this.default_border_color);
};


Shape.prototype.change_fill_color = function(color) {
    this.color = new Color(color);
	this.default_color = new Color(color);
};

Shape.prototype.change_border_color = function(color) {
    this.border_color = new Color(color);
	this.default_border_color = new Color(color);
};


Shape.prototype.highlight = function() {
    this.color.a = 1;
    this.textColor = "black";
};

Shape.prototype.darken = function() {
    this.textColor = "rgb(50,50,50)";
    this.color.a = 0.3;
};

Shape.prototype.full = function() {
    if (!this.full_details){
        this.full_details = true;
        this.height += 10;
        this.width += 50;
        this.update_vertices();
    }
};


Shape.prototype.partial = function() {
    if (this.full_details) {
        this.full_details = false;
        this.height -= 10;
        this.width -= 50;
        this.update_vertices();
    }
};


Shape.prototype.get_vertex_by_key = function(key) {
    for (var i = 0; i < this.vertices.length; i++) {
        if (this.vertices[i].key == key) {
            return this.vertices[i];
        }
    }
};

Shape.prototype.clone_vertices = function(shape){
    this.vertices = [];
    for (var i = 0; i < shape.vertices.length; i++) {
        this.vertices.push(new Vertex(shape.vertices[i]));
    }
};

Shape.prototype.get_center = function() {
    return new Vertex(this.x, this.y, 0);
};

Shape.prototype.draw_frame = function(ctx) {
    ctx.beginPath();
    for (var v = 1; v <= this.vertices.length; v++) {
        var curr_point = this.vertices[v%this.vertices.length];
        var prev_point = this.vertices[v-1];
        var next_point = this.vertices[(v+1)%this.vertices.length];
        var pre_line_direction = unit_vector(prev_point, curr_point);
        var pre_point = curr_point.subtract(pre_line_direction.mul(this.radius));
        var post_line_direction = unit_vector(curr_point, next_point);
        var post_point = curr_point.add(post_line_direction.mul(this.radius));
        if (v == 0) {
            ctx.moveTo(pre_point.x, pre_point.y);
        }
        ctx.lineTo(pre_point.x, pre_point.y);
        ctx.quadraticCurveTo(curr_point.x, curr_point.y, post_point.x, post_point.y);
    }
    ctx.closePath();
};

Shape.prototype.draw_fill = function(ctx) {
    // draw fill
    ctx.fillStyle = this.color.to_string();
    ctx.fill();
};

Shape.prototype.draw_stroke = function(ctx) {
    // draw border
    if (this.stroke > 0) {
        if (this.dashedBorder) {
            ctx.setLineDash([2,3]);
        }
        ctx.strokeStyle = this.border_color.to_string();
        ctx.lineWidth = this.stroke;
        ctx.stroke();
        ctx.setLineDash([0,0]);
    }
};

Shape.prototype.draw_text = function(ctx) {
    // draw text
    if (!this.full_details || this.layer.description == "") {
        ctx.font = "bold 14px Calibri";
        ctx.textAlign = "center";
        ctx.fillStyle = this.textColor;
        ctx.fillText(this.text, this.x, this.y + 3);
    } else {
        ctx.font = "bold 14px Calibri";

        ctx.textAlign = "center";
        ctx.fillStyle = this.textColor;
        ctx.fillText(this.text, this.x, this.y - 5);

        ctx.font = "11px Calibri";
        ctx.textAlign = "center";
        ctx.fillStyle = this.textColor;
        ctx.fillText(this.layer.description, this.x, this.y + 13);
    }
};

Shape.prototype.draw = function(ctx) {
    this.draw_frame(ctx);
    this.draw_fill(ctx);
    this.draw_stroke(ctx);
    this.draw_text(ctx);
};

/////////////////////////////////////
//  Rectangle

var Rectangle = function(x, y, width, height, radius, offset, stroke, text, color, border_color, dashedBorder, key, corner_anchor) {
    if (typeof x == "object") {
        // copy constructor
        var shape = x;
        Shape.call(this, shape);
        this.clone_vertices(shape);
        this.offset = shape.offset;
    } else {
        Shape.call(this, x, y, width, height, radius, stroke, text, color, border_color, dashedBorder, key, offset);
        this.offset = (typeof offset != 'undefined') ? offset : 10;
        this.corner_anchor = (typeof corner_anchor != 'undefined') ? corner_anchor : false;
    }
    this.update_vertices();
    this.type = "Rectangle";
};

inheritsFrom(Rectangle, Shape);

Rectangle.prototype.update_vertices = function() {
    var keys = [];
    for (var i = 0; i < this.vertices.length; i++) {
        keys.push(this.vertices[i].key);
    }
    if (this.corner_anchor) {
        this.vertices = [
            new Vertex(this.x, this.y, 0, keys[0]),
            new Vertex(this.x + this.width, this.y, 0, keys[1]),
            new Vertex(this.x + this.width - this.offset, this.y + this.height, 0, keys[2]),
            new Vertex(this.x - this.offset, this.y + this.height, 0, keys[3])
        ];
    } else {
        this.vertices = [
            new Vertex(this.x - this.width/2 + this.offset/2, this.y - this.height/2, 0, keys[0]),
            new Vertex(this.x + this.width/2 + this.offset/2, this.y - this.height/2, 0, keys[1]),
            new Vertex(this.x + this.width/2 - this.offset/2, this.y + this.height/2, 0, keys[2]),
            new Vertex(this.x - this.width/2 - this.offset/2, this.y + this.height/2, 0, keys[3])
        ];
    }
};

/////////////////////////////////////
//  Triangle

var Triangle = function(x, y, width, height, radius, stroke, color, border_color, key) {
    if (typeof x == "object") {
        // copy constructor
        var shape = x;
        Shape.call(this, shape);
        this.clone_vertices(shape);
    } else {
        Shape.call(this, x, y, width, height, radius, stroke, "", color, border_color, key);
        this.update_vertices();
    }
    this.type = "Triangle";
};

inheritsFrom(Triangle, Shape);


Triangle.prototype.update_vertices = function() {
    var keys = [];
    for (var i = 0; i < this.vertices.length; i++) {
        keys.push(this.vertices[i].key);
    }
    this.vertices = [
        new Vertex(this.x, this.y, 0, keys[0]),
        new Vertex(this.x + this.width, this.y + this.height/2, 0, keys[1]),
        new Vertex(this.x, this.y + this.height, 0, keys[2])
    ];
};


/////////////////////////////////////
//  Diamond

var Diamond = function(x, y, width, height, radius, stroke, color, border_color, key) {
    if (typeof x == "object") {
        // copy constructor
        var shape = x;
        Shape.call(this, shape);
        this.clone_vertices(shape);
    } else {
        Shape.call(this, x, y, width, height, radius, stroke, "", color, border_color, key);
        this.update_vertices();
    }
    this.type = "Diamond";
};

inheritsFrom(Diamond, Shape);

Diamond.prototype.update_vertices = function() {
    var keys = [];
    for (var i = 0; i < this.vertices.length; i++) {
        keys.push(this.vertices[i].key);
    }
    this.vertices = [
        new Vertex(this.x, this.y - this.height/2, 0, keys[0]),
        new Vertex(this.x + this.width/2, this.y, 0, keys[1]),
        new Vertex(this.x, this.y + this.height/2, 0, keys[2]),
        new Vertex(this.x - this.width/2, this.y, 0, keys[3])
    ];
};

/////////////////////////////////////
//  Hexagon

var Hexagon = function(x, y, width, height, radius, stroke, color, border_color, key) {
    if (typeof x == "object") {
        // copy constructor
        var shape = x;
        Shape.call(this, shape);
        this.clone_vertices(shape);
    } else {
        Shape.call(this, x, y, width, height, radius, stroke, "", color, border_color, key);
        this.update_vertices();
    }
    this.type = "Hexagon";
};

inheritsFrom(Hexagon, Shape);

Hexagon.prototype.update_vertices = function() {
    var keys = [];
    for (var i = 0; i < this.vertices.length; i++) {
        keys.push(this.vertices[i].key);
    }
    var side = this.width/2;
    this.vertices = [
        new Vertex(this.x - side/2, this.y - this.height/2, 0, keys[0]),
        new Vertex(this.x + side/2, this.y - this.height/2, 0, keys[1]),
        new Vertex(this.x + this.width/2, this.y, 0, keys[2]),
        new Vertex(this.x + side/2, this.y + this.height/2, 0, keys[3]),
        new Vertex(this.x - side/2, this.y + this.height/2, 0, keys[4]),
        new Vertex(this.x - this.width/2, this.y, 0, keys[5])
    ];
};


/////////////////////////////////////
//  Ellipse

var Circle = function(x, y, radius, stroke, text, color, border_color, key) {
    if (typeof x == "object") {
        // copy constructor
        var shape = x;
        Shape.call(this, shape);
        this.clone_vertices(shape);
    } else {
        Shape.call(this, x, y, 2*radius, 2*radius, 0, stroke, text, color, border_color, false, key);
        this.vertices = [];
        this.type = "Circle";
        this.update_vertices();
    }
};

inheritsFrom(Circle, Shape);

Circle.prototype.update_vertices = function() {
    var keys = [];
    for (var i = 0; i < this.vertices.length; i++) {
        keys.push(this.vertices[i].key);
    }
    this.vertices = [];
    var num_vertices = 36;
    for (var i = 0; i < num_vertices; i++) {
        this.vertices.push(new Vertex(this.x + (this.width/2)*Math.cos(i*2*Math.PI/num_vertices), this.y + (this.width/2)*Math.sin(i*2*Math.PI/num_vertices), 0, keys[i]));
    }
};
/**
 * Created by Itai Caspi on 26/07/2016.
 */

/////////////////////////////////////////
//  Camera

var Camera = function(direction, perpAxis, center) {
    this.setDirection(direction);
    this.perpAxis = perpAxis;
    this.perpAxis.normalize();
    this.center = center;
    this.zoom = 1;
};

Camera.prototype.setDirection = function(direction) {
    this.direction = direction;
    this.direction.normalize();
};

Camera.prototype.rotate = function(theta_x, theta_y, theta_z) {
    rotate(this.direction, origin, theta_x, theta_y, theta_z);
    rotate(this.perpAxis, origin, theta_x, theta_y, theta_z);
    this.direction.normalize();
    this.perpAxis.normalize();
};

Camera.prototype.translate = function(x, y, z) {
    translate(this.center, x, y, z);
};

/////////////////////////////////////////
//  Light

var Light = function(direction, center) {
    this.setDirection(direction);
    this.center = center;
};

Light.prototype.setDirection = function(direction) {
    this.direction = direction;
    this.direction.normalize();
};

/////////////////////////////////////////
//  Face - a rectangular object face

var Face = function(p0, p1, p2, p3, normal, color, fill, border) {
    this.vertices = [p0, p1, p2, p3];
    this.normal = normal;
    this.color = color;
    this.fill = fill ? fill : "full";
    this.border = border ? border : "full";
};

Face.prototype.center = function() {
    var centerX = 0;
    var centerY = 0;
    var centerZ = 0;
    for (var i = 0; i < 4; i++) {
        centerX += this.vertices[i].x;
        centerY += this.vertices[i].y;
        centerZ += this.vertices[i].z;
    }
    return new Vertex(centerX/4, centerY/4, centerZ/4);
};

Face.prototype.isBackFace = function(camera) {
    // Back-face culling
    return (this.normal.dot(camera.direction) > 0);
};

Face.prototype.pointerInside = function (xm, ym, camera) {

    var p0 = project(this.vertices[0], camera, true);
    var p1 = project(this.vertices[1], camera, true);
    var p2 = project(this.vertices[2], camera, true);
    var p3 = project(this.vertices[3], camera, true);

    // http://2000clicks.com/mathhelp/GeometryPointAndTriangle2.aspx
    var fAB = function (p1, p2) { return (ym - p1.y) * (p2.x - p1.x) - (xm - p1.x) * (p2.y - p1.y); };
    var fCA = function (p1, p3) { return (ym - p3.y) * (p1.x - p3.x) - (xm - p3.x) * (p1.y - p3.y); };
    var fBC = function (p2, p3) { return (ym - p2.y) * (p3.x - p2.x) - (xm - p2.x) * (p3.y - p2.y); };

    if (fAB(p0, p1) * fBC(p1, p3) > 0 && fBC(p1, p3) * fCA(p0, p3) > 0) return true;

    if (fAB(p1, p2) * fBC(p2, p3) > 0 && fBC(p2, p3) * fCA(p1, p3) > 0) return true;

    return false;
};

Face.prototype.shade = function (camera) {
    // Flat (Lambert) shading
    var N = this.normal;
    var lightSource = new Light(new Vertex(0,-3,-10), new Vertex(0,100,300));
    var lightVector = lightSource.center.add(this.center().mul(-1));
    lightVector.normalize();
    var light = Math.max(Math.min(190 + N.dot(lightVector) * 60, 255), 0);
    return new Color(light * this.color.r, light * this.color.g, light * this.color.b, 1);
};

Face.prototype.distanceToCamera = function(camera, p) {
    var point = p ? project3D(p, this.normal) : this.center();
    return point.dot(camera.direction);
};

/////////////////////////////////////////
//  Box - a 3D rectangular shape

var Box = function(center, width, height, depth, color, text, fill, border, type) {

    this.center = center;
    this.color = color;
    this.text = text ? text : width + "x" + height + "x" + depth;
    if (type && type != "Box") {
        this.fill = "none";
        this.border = "dashed";
        this.type = "BoundingBox";
        this.isClickable = false;
    } else {
        this.fill = "full";
        this.border = "full";
        this.type = "Box";
        this.isClickable = true;
    }

    //            7---------6
    //          / |        /|
    //         4---------5  |
    //         |  |      |  |
    //         | 3-------|--2    (back)
    //         |/        | /
    //         0---------1    (front)

    this.vertices = [
        new Vertex(center.x - width / 2, center.y - height / 2, center.z - depth / 2),
        new Vertex(center.x + width / 2, center.y - height / 2, center.z - depth / 2),
        new Vertex(center.x + width / 2, center.y + height / 2, center.z - depth / 2),
        new Vertex(center.x - width / 2, center.y + height / 2, center.z - depth / 2),
        new Vertex(center.x - width / 2, center.y - height / 2, center.z + depth / 2),
        new Vertex(center.x + width / 2, center.y - height / 2, center.z + depth / 2),
        new Vertex(center.x + width / 2, center.y + height / 2, center.z + depth / 2),
        new Vertex(center.x - width / 2, center.y + height / 2, center.z + depth / 2)
    ];

    this.normals = [
        new Vertex(0,0,-1),
        new Vertex(0,-1,0),
        new Vertex(0,1,0),
        new Vertex(-1,0,0),
        new Vertex(1,0,0),
        new Vertex(0,0,1)
    ];

    this.faces = [
        new Face(this.vertices[0], this.vertices[1], this.vertices[2], this.vertices[3], this.normals[0], color, this.fill, this.border), // bottom
        new Face(this.vertices[0], this.vertices[4], this.vertices[5], this.vertices[1], this.normals[1], color, this.fill, this.border), // front
        new Face(this.vertices[3], this.vertices[2], this.vertices[6], this.vertices[7], this.normals[2], color, this.fill, this.border), // back
        new Face(this.vertices[0], this.vertices[3], this.vertices[7], this.vertices[4], this.normals[3], color, this.fill, this.border), // left
        new Face(this.vertices[1], this.vertices[5], this.vertices[6], this.vertices[2], this.normals[4], color, this.fill, this.border), // right
        new Face(this.vertices[5], this.vertices[4], this.vertices[7], this.vertices[6], this.normals[5], color, this.fill, this.border)  // top
    ];

};

Box.prototype.pointerInside = function(xm, ym, camera) {
    for (var i = 0; i < this.faces.length; i++) {
        if (this.faces[i].pointerInside(xm ,ym, camera)) return true;
    }
};

Box.prototype.findTopRelativeToCamera = function(camera) {
    var centerX = 0;
    var minY = 10000;
    for (var i = 0; i < this.vertices.length; i++) {
        var P = project(this.vertices[i], camera, true);
        if (P.y < minY) minY = P.y;
        centerX += P.x;
    }
    centerX /= this.vertices.length;
    return new Vertex(centerX,minY - 10,0);
};

Box.prototype.rotate = function(theta_x, theta_y, theta_z) {
    for (var i = 0; i < this.vertices.length; i++) {
        rotate(this.vertices[i], this.center, theta_x, theta_y, theta_z);
    }
    for (var i = 0; i < this.normals.length; i++) {
        rotate(this.normals[i], origin, theta_x, theta_y, theta_z);
    }
};

Box.prototype.translate = function(x, y, z) {
    for (var i = 0; i < this.vertices.length; i++) {
        translate(this.vertices[i], x, y, z);
    }
    translate(this.center, x, y, z);
};


/////////////////////////////////////////
//  Line

var Arrow = function (start, end, type) {
    this.start = start;
    this.end = end;
    this.leftHand = end ? this.end.add(new Vertex(-5,0,3)) : 0;
    this.rightHand = end ? this.end.add(new Vertex(-5,0,-3)) : 0;
    this.vertices = [start, end, this.leftHand, this.rightHand];
    this.type = type ? type : "Arrow";
};

Arrow.prototype.setPosition = function(start, end) {
    this.start = start;
    this.end = end;
    this.leftHand = this.end.add(new Vertex(-5,0,3));
    this.rightHand = this.end.add(new Vertex(-5,0,-3));
};

Arrow.prototype.draw = function() {

};

/////////////////////////////////////////
//  Tensor

var Tensor = function(width, height, depth, length) {
    if (typeof width == "object") {
        var tensor = width;
        this.width = tensor.width;
        this.height = tensor.height;
        this.depth = tensor.depth;
        this.length = tensor.length;
    } else {
        this.width = (typeof width != 'undefined') ? width : 1;
        this.height = (typeof height != 'undefined') ? height : 1;
        this.depth = (typeof depth != 'undefined') ? depth : 1;
        this.length = (typeof length != 'undefined') ? length : 1;
    }
    this.type = "Tensor";
};

Tensor.prototype.size = function() {
    return this.width * this.height * this.depth * this.length;
};

Tensor.prototype.clone = function () {
    return new Tensor(this.width, this.height, this.depth, this.length);
};

Tensor.prototype.toBox = function(center, color) {
    return new Box(center, this.depth, this.width, this.height, color);
};

/**
 * Created by Itai Caspi on 26/07/2016.
 */


var inheritsFrom = function (child, parent) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
};

var Layer = function() {
    this.output =  new Tensor(1,1,1);
    this.weight = new Tensor();
    this.type = "";
    this.subtype = "";
    this.description = "";
};

Layer.prototype.updateOutputSize = function() {
    this.output = this.input.clone();
};

Layer.prototype.updateWeightSize = function() {
};

Layer.prototype.setInput = function(inputTensor) {
    this.input = inputTensor;
    this.updateOutputSize();
    this.updateWeightSize();
};

////////////////////////////////////////
//  Convolution

var Convolution = function(outputDepth, kernelWidth, kernelHeight, strideX, strideY, padX, padY) {
    if (kernelWidth == undefined) {
        // copy constructor
        var layer = outputDepth;
        assign(this, layer);
        this.output = new Tensor(layer.output);
    } else {
        Layer.call(this);
        this.output = new Tensor(1,1,outputDepth);
        this.kernelWidth = kernelWidth;
        this.kernelHeight = kernelHeight;
        this.strideX = strideX;
        this.strideY = strideY;
        this.padX = padX;
        this.padY = padY;
    }
    this.type = "Convolution";
    this.description = "Kernel " + this.kernelHeight + "x" + this.kernelWidth + " Stride " + this.strideX + " OFMs " + this.output.depth;
};

inheritsFrom(Convolution, Layer);

Convolution.prototype.updateOutputSize = function() {
    this.output.width = Math.floor((this.input.width + 2*this.padX - this.kernelWidth) / this.strideX + 1);
    this.output.height = Math.floor((this.input.height + 2*this.padY - this.kernelHeight) / this.strideY + 1);
};

Convolution.prototype.toBox = function(center, color) {
    var outputCenter = new Vertex(center.x, center.y, center.z);
    return this.output.toBox(outputCenter, color);
};

////////////////////////////////////////
//  Inner Product

var InnerProduct = function(outputDepth) {
    if (typeof outputDepth == "object") {
        // copy constructor
        assign(this, outputDepth);
    } else {
        Layer.call(this);
        this.output.width = 1;
        this.output.height = 1;
        this.output.depth = outputDepth;
        this.type = "InnerProduct";
    }
};

InnerProduct.prototype.updateOutputSize = function() {
};

inheritsFrom(InnerProduct, Layer);

////////////////////////////////////////
//  Pooling

var Pooling = function(kernelWidth, kernelHeight, strideX, strideY, padX, padY, poolingType) {
    if (typeof kernelWidth == "object") {
        // copy constructor
        assign(this, kernelWidth);
    } else {
        Layer.call(this);
        this.kernelWidth = kernelWidth;
        this.kernelHeight = kernelHeight;
        this.strideX = strideX;
        this.strideY = strideY;
        this.padX = padX;
        this.padY = padY;
        this.poolingType = poolingType;
        this.type = "Pooling";
        this.description = "Kernel " + this.kernelHeight + "x" + this.kernelWidth + " Stride " + this.strideX;
    }
};

inheritsFrom(Pooling, Layer);

Pooling.prototype.updateOutputSize = function() {
    this.output.width = Math.floor((this.input.width + 2*this.padX - this.kernelWidth) / this.strideX + 1);
    this.output.height = Math.floor((this.input.height + 2*this.padY - this.kernelHeight) / this.strideY + 1);
};

////////////////////////////////////////
//  Deconvolution

var Deconvolution = function(numOutputs, kernelWidth, kernelHeight, strideX, strideY, padX, padY, pooling_type) {
    if (typeof numOutputs == "object") {
        // copy constructor
        assign(this, numOutputs);
    } else {
        Layer.call(this);
        this.kernelWidth = kernelWidth;
        this.kernelHeight = kernelHeight;
        this.strideX = strideX;
        this.strideY = strideY;
        this.padX = padX;
        this.padY = padY;
        this.type = "Deconvolution";
        this.description = "Kernel " + this.kernelHeight + "x" + this.kernelWidth + " Stride " + this.strideX;
    }
};

inheritsFrom(Deconvolution, Layer);

Deconvolution.prototype.updateOutputSize = function() {
    this.output.width = (this.input.width - 1)*this.strideX - 2*this.padX + this.kernelWidth;
    this.output.height = (this.input.height - 1)*this.strideY - 2*this.padY + this.kernelHeight;
};


////////////////////////////////////////
//  Concatenate

var Concatenate = function() {
    Layer.call(this);
};

inheritsFrom(Concatenate, Layer);


////////////////////////////////////////
//  Normalization Layer

var NormalizationLayer = function() {
    Layer.call(this);
    this.type = "Normalization";
};

inheritsFrom(NormalizationLayer, Layer);

////////////////////////////////////////
//  Local Response Normalization

var LRN = function(numNeighbours, k, alpha, beta) {
    if (typeof numNeighbours == "object") {
        // copy constructor
        assign(this, numNeighbours);
    } else {
        NormalizationLayer.call(this);
        this.numNeighbours = numNeighbours;
        this.k = k;
        this.alpha = alpha;
        this.beta = beta;
        this.subtype = "LocalResponseNormalization";
        this.description = "α " + this.alpha + " β " + this.beta + " K " + this.k;
    }
};

inheritsFrom(LRN, NormalizationLayer);


////////////////////////////////////////
//  Batch Normalization

var BatchNormalization = function() {
    NormalizationLayer.call(this);
    this.subtype = "BatchNormalization";
};

inheritsFrom(BatchNormalization, NormalizationLayer);


////////////////////////////////////////
//  Activatrion

var ActivationLayer = function() {
    Layer.call(this);
    this.type = "Activation";
};

inheritsFrom(ActivationLayer, Layer);

////////////////////////////////////////
//  ReLU

var ReLU = function() {
    ActivationLayer.call(this);
    this.subtype = "ReLU";
};

inheritsFrom(ReLU, ActivationLayer);

////////////////////////////////////////
//  Sigmoid

var Sigmoid = function() {
    ActivationLayer.call(this);
    this.subtype = "Sigmoid";
};

inheritsFrom(Sigmoid, ActivationLayer);

////////////////////////////////////////
//  TanH

var TanH = function() {
    ActivationLayer.call(this);
    this.subtype = "TanH";
};

inheritsFrom(TanH, ActivationLayer);


////////////////////////////////////////
//  ELU

var ELU = function() {
    ActivationLayer.call(this);
    this.subtype = "ELU";
};

inheritsFrom(ELU, ActivationLayer);


////////////////////////////////////////
//  HardSigmoid

var HardSigmoid = function() {
    ActivationLayer.call(this);
    this.subtype = "HardSigmoid";
};

inheritsFrom(HardSigmoid, ActivationLayer);


////////////////////////////////////////
//  Regularization

var RegularizationLayer = function() {
    Layer.call(this);
    this.type = "Regularization";
};

inheritsFrom(RegularizationLayer, Layer);

////////////////////////////////////////
//  Dropout

var Dropout = function(keepProbability) {
    RegularizationLayer.call(this);
    this.keepProbability = keepProbability;
    this.subtype = "Dropout";
};

inheritsFrom(Dropout, RegularizationLayer);

////////////////////////////////////////
//  Maxout

var Maxout = function() {
    RegularizationLayer.call(this);
    this.subtype = "Maxout";
};

inheritsFrom(Maxout, RegularizationLayer);


////////////////////////////////////////
//  DropConnect

var DropConnect = function() {
    RegularizationLayer.call(this);
    this.subtype = "DropConnect";
};

inheritsFrom(DropConnect, RegularizationLayer);


////////////////////////////////////////
//  Zoneout

var Zoneout = function() {
    RegularizationLayer.call(this);
    this.subtype = "Zoneout";
};

inheritsFrom(Zoneout, RegularizationLayer);




///////////////////////////////////////
// Sequential

var Sequential = function() {
    this.layers = [];
    this.type = "Sequential";
};

Sequential.prototype.push = function(layer) {
    if (layer.type != "Arrow") {
        if (this.layers.length == 1) {
            layer.setInput(this.layers[this.layers.length - 1]);
        } else if (this.layers.length > 1) {
            var back = 1;
            while (this.layers[this.layers.length - back].type != "Convolution") back++;
            layer.setInput(this.layers[this.layers.length - back].output);
        }
    }
    this.layers.push(layer);
};

Sequential.prototype.toObjects = function(center, color, alignment) {
    var currentCenter = center;
    var currentColor = color;
    var objects = [];
    var minPos = 9999;
    if (alignment) {
        for (var i = 0; i < this.layers.length; i++) {
            var layer = this.layers[i];
            while (this.layers.type == "Sequential") {
                // TODO: this deals only with first layer in the sequential net
                layer = layers[0];
            }
            if (layer.height < minPos) minPos = layer.height;
        }
    }
    for (var i = 0; i < this.layers.length; i++) {
        if (this.layers[i].type == "Convolution" || this.layers[i].type == "Tensor") {
            currentCenter = currentCenter.add(new Vertex(i > 0 ? this.layers[i].output.depth/2 + 25 : 0, 0, 0));
            // align objects to top or bottom
            if (alignment == "bottom" && i > 0) currentCenter.z = -(minPos - this.layers[i].output.height)/2;
            if (alignment == "top" && i > 0) currentCenter.z = (minPos - this.layers[i].output.height)/2;
            objects.push(this.layers[i].toBox(currentCenter, currentColor));
            currentColor = nextColor(currentColor);
            currentCenter = currentCenter.add(new Vertex(i == 0 ? this.layers[i].depth/2 : this.layers[i].output.depth/2, 0, 0));
        } else if (this.layers[i].type == "Arrow") {
            currentCenter = currentCenter.add(new Vertex(15, 0, 0));
            var end = currentCenter.add(new Vertex(70,0,0));
            objects.push(new Arrow(currentCenter, end));
            currentCenter = end;
        }
    }

    return objects;
};
/**
 * Created by Itai Caspi on 26/07/2016.
 */


// project point on 3d plane
function project3D(P, planeN) {
    var dist = planeN.dot(P);
    return new Vertex(P.x - dist*planeN.x, P.y - dist*planeN.y, P.z - dist*planeN.z);
}

// project a vertex onto a manifold
function project(P, camera, recenter) {
    var axes = getAxes(camera);
    var newP = recenter ? P.add(camera.center) : P;
    var projection = new Vertex(newP.dot(axes[0]), newP.dot(axes[1]), 0);
    return recenter ? projection.mul(camera.zoom) : projection;
}

// rotate a point in space around an axis
function rotate(M, center, theta_x, theta_y, theta_z) {
    // Rotation matrix coefficients
    var ctx = Math.cos(theta_x);
    var stx = Math.sin(theta_x);
    var cty = Math.cos(theta_y);
    var sty = Math.sin(theta_y);
    var ctz = Math.cos(theta_z);
    var stz = Math.sin(theta_z);

    // Move around center
    translate(M, -center.x, -center.y, -center.z);

    // Rotation
    var Rx = new Matrix([[1,    0,    0],
        [0,    ctx,  -stx],
        [0,    stx,  ctx]]);
    var Ry = new Matrix([[cty,  0,    sty],
        [0,    1,    0],
        [-sty, 0,    cty]]);
    var Rz = new Matrix([[ctz,  -stz, 0],
        [stz,  ctz,  0],
        [0,    0,    1]]);

    var result = Rz.dot(Ry.dot(Rx.dot(M)));

    // Move back to original place
    M.x = result.x + center.x;
    M.y = result.y + center.y;
    M.z = result.z + center.z;
}

function translate(M, x, y, z) {
    M.x += x;
    M.y += y;
    M.z += z;
}
/**
 * Created by icaspi on 1/24/2017.
 */


function download_as_file(filename, data, type) {
    // Download the text as a file to the user's machine
    if (filename == "") {
        filename = "neuralizer_topology";
        $("filename").val(filename);
    }
    var link = document.createElement("a");
    link.setAttribute("target","_blank");
    if (type == "text") {
        if(Blob !== undefined) {
            var blob = new Blob([data], {type: "text/plain"});
            link.setAttribute("href", URL.createObjectURL(blob));
        } else {
            link.setAttribute("href","data:text/plain," + encodeURIComponent(data));
        }
        link.setAttribute("download", filename + ".txt");
    } else if (type == "image") {
        link.setAttribute("href", data);
        link.setAttribute("download", filename + ".png");
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function save_current_state_as_image(filename) {
    // download the current state to the user's machine as an image
    canvas_manager.show_message("Downloading topology image", true);

    // get relevant area
    var bb = canvas_manager.get_bounding_box_over_all_shapes();
    var margin = 20;
    var width = bb.max_x - bb.min_x + margin*2;
    var height = bb.max_y - bb.min_y + margin*2;
    var x = bb.min_x-margin;
    var y = bb.min_y-margin;

    canvas_manager.select_all_shapes();
    canvas_manager.draw_curr_state_if_necessary();

    // crop image to relevant area
    var canvas = canvas_manager.canvas;
    var tempCanvas = document.createElement("canvas"),
        tCtx = tempCanvas.getContext("2d");
    tempCanvas.width = width;
    tempCanvas.height = height;
    tCtx.drawImage(canvas_manager.canvas,-x,-y);

    var image = tempCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    download_as_file($("#filename").val(), image, "image");
}

function save_current_state_to_file(framework) {
    // download the current state to the user's machine
    canvas_manager.show_message("Downloading topology", true);
    if (framework == "Neuralizer") {
        var text = JSON.stringify(canvas_manager.stored_states[canvas_manager.current_timestep]);
        download_as_file($("#filename").val(), text, "text");
    } else {
        canvas_manager.show_message("Downloading topology", true);
        var text = JSON.stringify(canvas_manager.to_graph(), null, "\t");
        download_as_file($("#filename").val(), text, "text");
    }
}

function load_state_from_file() {
    // load a file as the current state
    var fileInput = document.getElementById('fileInput');

    var file = fileInput.files[0];
    var name = fileInput.value.split(/(\\|\/)/g).pop().replace(/\.[^/.]+$/, "");
    var textType = /text.*/;

    if (file.type.match(textType)) {
        canvas_manager.show_message("Loading topology", true);
        var reader = new FileReader();

        reader.onload = function(e) {
            var state = JSON.parse(reader.result);
            canvas_manager.load_state(state);
            sidebar_manager.switch_sidebar_mode('designer');
            $("#filename").val(name);
        };
        reader.readAsText(file);

    } else {
        canvas_manager.show_message("File not supported!");
    }
}
//
// function export_current_state_to_framework_file() {
//     canvas_manager.show_message("Downloading topology", true);
//     var text = JSON.stringify(canvas_manager.to_graph(), null, "\t");
//     download_as_file($("#filename").val(), text, "text");
// }
/**
 * Created by icaspi on 1/30/2017.
 */


var CanvasManager = function(canvas) {
    this.canvas = canvas;
    this.fix_canvas_size(canvas);
    this.ctx = this.canvas.getContext('2d');

    // shapes
    this.shapes = [];
    this.arrows = [];
    this.current_arrow = new Line([], 5, new Color(0, 0, 0, 1), 3);
    this.snap_threshold = 10;

    // canvas selection
    this.selection_box = new Rectangle(0, 0, 0, 0, 2, 0, 2, "", new Color(0, 0, 0, 0), new Color(100, 100, 100, 1), true, undefined, true);
    this.selected_shapes = [];
    this.selected_color_idx = 0;

    // clipboard
    this.clipboard = [];
    this.paste_random_move_size = 20;

    // cursor management
    this.shape_with_content_pointed_by_cursor = false;
    this.shape_with_border_pointed_by_cursor = false;
    this.arrow_with_border_pointed_by_cursor = false;
    this.arrow_with_end_pointed_by_cursor = false;
    this.cursor_diff_x = 0;
    this.cursor_diff_y = 0;
    this.cursor_x = 0;
    this.cursor_y = 0;
    this.cursor_accum_x = 0;
    this.cursor_accum_y = 0;
    this.mouse_is_pressed = false;
    this.available_mouse_buttons = ["left", "middle", "right"];
    this.pressed_mouse_button = this.available_mouse_buttons[0];

    // state storing
    // the buffer is initialized with an empty state, current_timestep points to the last stored state
    this.stored_states = [this.curr_state_to_json()];
    this.current_timestep = 0;

    // draw
    this.draw_required = false;
};

CanvasManager.prototype.fix_canvas_size = function(canvas) {
    this.canvas = canvas;
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
};

//////////////////////////////
// Clipboard Management

CanvasManager.prototype.copy_from_clipboard = function() {
    var i;
    this.clipboard = [];

    // clone all the selected shapes
    for (i = 0; i < this.selected_shapes.length; i++) {
        // I clone each object so that it will be detached from the original object
        var copiedObject = this.selected_shapes[i].clone();
        copiedObject.set_layer(this.selected_shapes[i].layer);
        this.clipboard.push(copiedObject);
    }
};

CanvasManager.prototype.paste_from_clipboard = function() {
    var i;
    var random_translation_x = this.paste_random_move_size*Math.random();
    var random_translation_y = this.paste_random_move_size*Math.random();
    this.reset_selected_shapes();
    this.darken_all_shapes();
    for (i = 0; i < this.clipboard.length; i++) {
        // I clone again each object from the clipboard so that multiple pastes will be possible
        var copiedObject = this.clipboard[i].clone();
        copiedObject.set_layer(this.clipboard[i].layer);
        copiedObject.translate(50 + random_translation_x, 50 + random_translation_y);

        if (copiedObject.type != "Line") {
            copiedObject.highlight();
            this.shapes.push(copiedObject);
            this.selected_shapes.push(copiedObject);
        } else {
            this.arrows.push(copiedObject);
        }
    }
    this.save_state();
    this.draw_required = true;
};

/////////////////////////////////
// Pointer and Selection Methods

CanvasManager.prototype.snap_to_grid = function(step_size, counter, diff) {
    // uses the step size for shape movement to determine the new shape location
    var after = (counter + diff) / step_size;
    var before = counter / step_size;
    var change = 0;
    if (after < 0) {
        change = Math.ceil(after) - Math.ceil(before);
    } else {
        change = Math.floor(after) - Math.floor(before);
    }
    if (change != 0) {
        diff = change * step_size;
        counter = 0;
    } else {
        counter += diff;
        diff = 0;
    }
    return [counter, diff];
};

CanvasManager.prototype.get_primary_selected_shape = function() {
    if (this.selected_shapes.length > 0) {
        return this.selected_shapes[0];
    }
    return false;
};


CanvasManager.prototype.update_cursor_state = function(x, y, pressed_button, is_pressed) {
    this.cursor_diff_x = x - this.canvas.getBoundingClientRect().left - this.cursor_x;
    this.cursor_diff_y = y - this.canvas.getBoundingClientRect().top - this.cursor_y;
    this.cursor_x = x - this.canvas.getBoundingClientRect().left;
    this.cursor_y = y - this.canvas.getBoundingClientRect().top;
    this.mouse_is_pressed = (typeof is_pressed != 'undefined') ? is_pressed : this.mouse_is_pressed;
    if (pressed_button < this.available_mouse_buttons.length) {
        this.pressed_mouse_button = this.available_mouse_buttons[pressed_button];
    }
    this.update_pointed_objects();
};

CanvasManager.prototype.update_pointed_objects = function() {
    this.shape_with_content_pointed_by_cursor = false;
    this.shape_with_border_pointed_by_cursor = false;
    this.arrow_with_border_pointed_by_cursor = false;
    this.arrow_with_end_pointed_by_cursor = false;

    var i;
    for (i = 0; i < this.shapes.length; i++) {
        var shape = this.shapes[i];
        if (shape.pointer_is_on_the_border(this.cursor_x, this.cursor_y, this.ctx)) {
            this.shape_with_border_pointed_by_cursor = shape;
        } else if (shape.pointer_is_inside(this.cursor_x, this.cursor_y)) {
            this.shape_with_content_pointed_by_cursor = shape;
        }
    }

    for (i = 0; i < this.arrows.length; i++) {
        var arrow = this.arrows[i];
        if (arrow.pointer_is_on_end(this.cursor_x, this.cursor_y, this.ctx)) {
            this.arrow_with_end_pointed_by_cursor = arrow;
        } else if (arrow.pointer_is_on_the_border(this.cursor_x, this.cursor_y, this.ctx)) {
            this.arrow_with_border_pointed_by_cursor = arrow;
        }
    }
};

CanvasManager.prototype.select_shape = function(shape) {
    this.selected_shapes = [shape];
    this.highlight_selected_shapes();
};

CanvasManager.prototype.update_selected_shapes_from_selection_box = function() {
    // update the selected shapes from the selection box position
    if (Math.abs(this.selection_box.width) < 10 || Math.abs(this.selection_box.height) < 10) return;

    this.selected_shapes = [];
    for (var i = 0; i < this.shapes.length; i++) {
        var shape = this.shapes[i];
        var left_check = shape.x > this.selection_box.x;
        var top_check = shape.y > this.selection_box.y;
        var right_check = shape.x + shape.width < this.selection_box.x + this.selection_box.width;
        var bottom_check = shape.y + shape.height < this.selection_box.y + this.selection_box.height;
        if ((left_check == true && top_check == true && right_check == true && bottom_check == true) ||
            (left_check == false && top_check == false && right_check == false && bottom_check == false) ||
            (left_check == true && top_check == false && right_check == true && bottom_check == false) ||
            (left_check == false && top_check == true && right_check == false && bottom_check == true)) {
            this.selected_shapes.push(shape);
        }
    }
};

CanvasManager.prototype.change_selected_shapes_color = function(color_idx) {
    this.selected_color_idx = color_idx;
    var r = border_colors[color_idx].r;
    var g = border_colors[color_idx].g;
    var b = border_colors[color_idx].b;
    var max_val = Math.max(Math.max(r, g), b);

    for (var s = 0; s < this.selected_shapes.length; s++) {
        var border_color = new Color(r, g, b, 1);
        var fill_color = new Color(r + 0.5 * max_val, g + 0.5 * max_val, b + 0.5 * max_val, 0);

        this.selected_shapes[s].change_fill_color(fill_color);
        this.selected_shapes[s].change_border_color(border_color);
        for (var a = 0; a < this.arrows.length; a++) {
            this.arrows[a].linked_shape_color_change(this.selected_shapes[s], this.arrows);
        }
    }

    this.save_state();
    this.draw_required = true;
};


CanvasManager.prototype.darken_all_shapes = function() {
    var i;
    for (i = 0; i < this.shapes.length; i++) {
        this.shapes[i].darken();
    }

    this.draw_required = true;
};

CanvasManager.prototype.highlight_selected_shapes = function() {
    this.darken_all_shapes();
    var i;
    for (i = 0; i < this.selected_shapes.length; i++) {
        this.selected_shapes[i].highlight();
    }
    if (this.shape_with_content_pointed_by_cursor) {
        this.shape_with_content_pointed_by_cursor.highlight();
    }

    this.draw_required = true;
};

CanvasManager.prototype.remove_selected_shapes = function() {
    var i, j;
    var connected_arrows = [];
    // get all connected arrows
    var temp_connected_arrows = this.find_connected_arrows(this.selected_shapes);
    while (temp_connected_arrows.length > 0) {
        for (i = 0; i < temp_connected_arrows.length; i++) {
            connected_arrows.push(temp_connected_arrows[i]);
        }
        temp_connected_arrows = this.find_connected_arrows(temp_connected_arrows);
    }
    for (var a = this.arrows.length - 1; a >= 0; a--) {
        for (j = 0; j < connected_arrows.length; j++) {
            if (connected_arrows[j].key == this.arrows[a].key) {
                this.arrows.splice(a, 1);
                break;
            }
        }
    }
    for (var s = this.selected_shapes.length - 1; s >= 0; s--) {
        var shape_index = this.get_shape_index(this.selected_shapes[s]);
        this.shapes.splice(shape_index, 1);
        this.selected_shapes.splice(s, 1);
    }
    this.draw_required = true;
};


CanvasManager.prototype.move_selected_shapes = function() {
    var diff_used = this.move_shapes_with_alignment(this.selected_shapes, this.cursor_diff_x + this.cursor_accum_x, this.cursor_diff_y + this.cursor_accum_y);
    this.cursor_accum_x = (this.cursor_diff_x + this.cursor_accum_x - diff_used.x);
    this.cursor_accum_y = (this.cursor_diff_y + this.cursor_accum_y - diff_used.y);
};

CanvasManager.prototype.shape_is_selected = function(shape) {
    // check if the given shape is currently selected
    var i;
    for (i = 0; i < this.selected_shapes.length; i++) {
        if (shape.key == this.selected_shapes[i].key) {
            return true;
        }
    }
    return false;
};

CanvasManager.prototype.select_all_shapes = function() {
    this.selected_shapes = [];
    for (var i = 0; i < this.shapes.length; i++) {
        this.selected_shapes.push(this.shapes[i]);
    }
    this.highlight_selected_shapes();
};

CanvasManager.prototype.reset_selected_shapes = function() {
    this.selected_shapes = [];
};

CanvasManager.prototype.hide_selection_box = function() {
    this.selection_box.hide();
    this.selection_box.width = 0;
    this.selection_box.height = 0;
    this.draw_required = true;
};

CanvasManager.prototype.initialize_selection_box = function() {
    this.selection_box.x = this.cursor_x;
    this.selection_box.y = this.cursor_y;
    this.reset_selected_shapes();
    this.draw_required = true;
};

CanvasManager.prototype.set_selection_box = function() {
    this.selection_box.width = this.cursor_x - this.selection_box.x;
    this.selection_box.height = this.cursor_y - this.selection_box.y;
    this.selection_box.update_vertices();
    this.selection_box.show();
    this.update_selected_shapes_from_selection_box();
    this.draw_required = true;
};

CanvasManager.prototype.selection_box_is_active = function() {
    return this.selection_box.width != 0 || this.selection_box.height != 0;
};

CanvasManager.prototype.get_unselected_shapes = function() {
    var unselected_shapes = [];
    for (var i = 0; i < this.shapes.length; i++) {
        var is_selected = false;
        for (var j = 0; j < this.selected_shapes.length; j++) {
            if (this.selected_shapes[j].key == this.shapes[i].key) {
                is_selected = true;
            }
        }
        if (!is_selected) {
            unselected_shapes.push(this.shapes[i]);
        }
    }
    return unselected_shapes;
};

//////////////////////////
// Drawing Methods

CanvasManager.prototype.draw_curr_state_if_necessary = function() {
    // draws only if the drawing flag was turned on
    if (this.draw_required) {
        this.draw_curr_state();
    }
};

CanvasManager.prototype.draw_curr_state = function() {
    this.clear_canvas();

    // draw everything
    this.draw_array(this.arrows);
    this.selection_box.draw(this.ctx);
    this.current_arrow.draw(this.ctx);
    this.draw_array(this.shapes);
    this.update_key_info();

    // draw cursor markers
    if (!this.mouse_is_pressed || this.selected_shapes.length == 0) {
        if (this.arrow_with_end_pointed_by_cursor && this.current_arrow.points == 0) {
            this.draw_circle(this.arrow_with_end_pointed_by_cursor.border_color.to_string(), "white", 4, this.cursor_x, this.cursor_y, 5);
            this.draw_text("click to detach", this.cursor_x+50, this.cursor_y, 14);
        } else if (this.shape_with_border_pointed_by_cursor) {
            this.draw_circle(this.shape_with_border_pointed_by_cursor.border_color.to_string(), "transparent", 0, this.cursor_x, this.cursor_y, 5);
            //draw_text("click to attach", xm+50, ym, 14);
        } else if (this.arrow_with_border_pointed_by_cursor) {
            this.draw_circle(this.arrow_with_border_pointed_by_cursor.border_color.to_string(), "transparent", 0, this.cursor_x, this.cursor_y, 5);
            //draw_text("click to attach", xm+50, ym, 14);
        }
    }
};

CanvasManager.prototype.clear_canvas = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

CanvasManager.prototype.draw_array = function(array) {
    for (var i = 0; i < array.length; i++) {
        array[i].draw(this.ctx);
    }
};

CanvasManager.prototype.draw_text = function(text, x, y, size) {
    this.ctx.font = size + "px Calibri";
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "black";
    this.ctx.shadowColor = "white";
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;
    this.ctx.shadowBlur = 2;
    this.ctx.fillText(text, x, y);
    this.ctx.shadowColor = "transparent";
};

CanvasManager.prototype.draw_circle = function(color, border_color, border_width, x, y, size) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = border_color;
    this.ctx.lineWidth = border_width;
    this.ctx.stroke();
    this.ctx.fill();
};


CanvasManager.prototype.get_key_object = function(key) {
    var fadeInTime = 0;
    var keys = {
        "backspace": "Undo last point",
        "esc": "Cancel edge",
        "delete": "Remove",
        "ctrl-c": "Copy",
        "ctrl-v": "Paste",
        "ctrl-z": "Undo",
        "ctrl-y": "Redo",
        "ctrl-a": "Select all"
    };
    var object;
    if (key.substring(0,4) == "ctrl") {
        object = '<span class="key-wrap"><icon class="keyboard-key ctrl"></icon><span class="key-info">+</span>' +
            '<icon class="keyboard-key ' + key.substring(5) + '"></icon></span><span class="key-info">' + keys[key] + '</span><br>';
    } else {
        object = '<span class="key-wrap"><icon class="keyboard-key ' + key + '"></icon></span><span class="key-info">' + keys[key] + '</span><br>';
    }
    return $(object).hide().fadeIn(fadeInTime);
};

CanvasManager.prototype.update_key_info = function() {
    var keys_container = $("#canvas_keys");
    $(keys_container).empty();
    // arrow is not currently being created
    if (this.current_arrow.points > 0) {
        $(keys_container).append(this.get_key_object("esc"));
        $(keys_container).append(this.get_key_object("backspace"));
    } else {
        if (this.selected_shapes.length > 0) {
            // shape is currently selected
            $(keys_container).append(this.get_key_object("delete"));
            $(keys_container).append(this.get_key_object("ctrl-c"));
        }
        if (this.clipboard.length > 0) {
            $(keys_container).append(this.get_key_object("ctrl-v"));
        }
        if (this.current_timestep > 0) {
            $(keys_container).append(this.get_key_object("ctrl-z"));
        }
        if (this.current_timestep < this.stored_states.length - 1) {
            $(keys_container).append(this.get_key_object("ctrl-y"));
        }
        if (this.shapes.length > 0) {
            $(keys_container).append(this.get_key_object("ctrl-a"));
        }
    }
};


///////////////////////////////////////
// State Management

CanvasManager.prototype.curr_state_to_json = function() {
    return JSON.stringify({"shapes": this.shapes, "arrows": this.arrows});
};

CanvasManager.prototype.json_to_curr_state = function(json_state) {
    var state = JSON.parse(json_state);
    console.log(state);
    this.shapes = state["shapes"];
    this.arrows = state["arrows"];

    this.selected_shapes = [];

    // parse shapes
    for (var s = this.shapes.length-1; s >= 0; s--) {
        var shape = this.shapes[s];
        if (shape.type == "Rectangle") {
            this.shapes[s] = new Rectangle(shape);
        } else if (shape.type == "Triangle") {
            this.shapes[s] = new Triangle(shape);
        } else if (shape.type == "Circle") {
            this.shapes[s] = new Circle(shape);
        }
        this.shapes[s].set_layer(shape.layer);
    }

    // parse arrows
    for (var a = this.arrows.length-1; a >= 0; a--) {
        // this is a nasty workaround which should be changed
        var start = false;
        var end = false;
        for (var s = 0; s < this.shapes.length; s++) {
            if (this.arrows[a].linkStart.shape.key == this.shapes[s].key) {
                start = this.shapes[s];
            } else if (this.arrows[a].linkEnd.shape.key == this.shapes[s].key) {
                end = this.shapes[s];
            }
        }
        for (var i = 0; i < this.arrows.length; i++) {
            if (this.arrows[a].linkStart.shape.key == this.arrows[i].key) {
                start = this.arrows[i];
            } else if (this.arrows[a].linkEnd.shape.key == this.arrows[i].key) {
                end = this.arrows[i];
            }
        }
        this.arrows[a] = new Line(this.arrows[a], start, end);
    }

};

CanvasManager.prototype.save_state = function() {
    // save the state of the designer in the buffer
    var current_state = this.curr_state_to_json();
    if (current_state != this.stored_states[this.current_timestep]) {
        this.current_timestep += 1;
        this.stored_states[this.current_timestep] = current_state;
    }
};

CanvasManager.prototype.load_state = function(state) {
    // load the given state to the designer
    this.json_to_curr_state(state);

    this.draw_required = true;
    this.draw_curr_state_if_necessary();
};


CanvasManager.prototype.undo = function() {
    // undo changes
    if (this.current_timestep > 0) {
        this.current_timestep -= 1;
        this.load_state(this.stored_states[this.current_timestep]);
        return true;
    }
    return false;
};


CanvasManager.prototype.redo = function () {
    // redo changes
    if (this.current_timestep < this.stored_states.length-1) {
        this.current_timestep += 1;
        this.load_state(this.stored_states[this.current_timestep]);
        return true;
    }
    return false;
};

//////////////////////////////////
// Shape & arrow editing

CanvasManager.prototype.reset_current_arrow = function() {
    this.current_arrow = new Line([], 5, new Color(0, 0, 0, 1), 3);
};


CanvasManager.prototype.get_shape_index = function(shape) {
    var i;
    for (i = 0; i < this.shapes.length; i++) {
        if (this.shapes[i].key == shape.key) {
            return i;
        }
    }
    return -1;
};

CanvasManager.prototype.get_arrow_index = function(arrow) {
    var i;
    for (i = 0; i < this.arrows.length; i++) {
        if (this.arrows[i].key == arrow.key) {
            return i;
        }
    }
    return -1;
};

CanvasManager.prototype.get_object_with_pointed_border = function() {
    // returns a shape which has a border with the cursor over it. prioritizes shapes over arrows.
    var shape = false;
    if (this.shape_with_border_pointed_by_cursor) {
        shape = this.shape_with_border_pointed_by_cursor;
    } else if (this.arrow_with_border_pointed_by_cursor) {
        shape = this.arrow_with_border_pointed_by_cursor;
    }
    return shape;
};

CanvasManager.prototype.extend_current_arrow = function() {
    var shape = this.get_object_with_pointed_border();

    if (this.current_arrow.points > 0) {
        // extend current arrow
        this.current_arrow.points++;
    }
    if (this.arrow_with_end_pointed_by_cursor) {
        // detach pointed arrow
        this.current_arrow = this.arrow_with_end_pointed_by_cursor;
        this.arrows.splice(this.get_arrow_index(this.arrow_with_end_pointed_by_cursor), 1);
        this.current_arrow.points--;
        this.arrow_with_end_pointed_by_cursor = false;

        this.draw_required = true;
    } else if (shape) {
        // start a new line
        var line_points = shape.pointer_is_on_the_border_line(this.cursor_x, this.cursor_y, this.ctx);
        line_points.shape = shape;

        var point = new Vertex(this.cursor_x, this.cursor_y, 0);
        if (this.current_arrow.points == 0) {
            // start a new line
            this.current_arrow.start_line(point, shape.border_color, line_points);
        } else {
            // make sure the line is not linked to itself
            if (!(this.current_arrow.shapes_are_linked([shape])[0]) || this.current_arrow.linkStart.shape.type != "Line") {
                this.current_arrow.end_line(point, line_points);
                this.arrows.push(this.current_arrow);
                this.current_arrow = new Line([], 5, new Color(0, 0, 0, 1), 3);
            }
        }
        this.reset_selected_shapes();

        this.draw_required = true;
    }

};

CanvasManager.prototype.get_shape_color_idx = function(shape) {
    for (var i = 0; i < border_colors.length; i++) {
        if (border_colors[i].to_string() == shape.border_color.to_string()) {
            return i;
        }
    }
    return 0;
};

CanvasManager.prototype.add_shape = function(shape) {
    this.shapes.push(shape);
    this.select_shape(shape);
};

CanvasManager.prototype.move_shapes_with_alignment = function(shapes, diff_x, diff_y) {
    var i;
    // move shapes
    for (i = 0; i < shapes.length; i++) {
        // align to nearest center
        var shape_center = shapes[i].get_center();
        var nearest_center = this.nearest_shape_center(shape_center);
        if (Math.abs(nearest_center.dist_x) >= this.snap_threshold && Math.abs(-nearest_center.dist_x + diff_x) < this.snap_threshold) {
            diff_x = nearest_center.dist_x;
        } else if (Math.abs(nearest_center.dist_x) < this.snap_threshold && Math.abs(diff_x) < this.snap_threshold) {
            diff_x = 0;
        }
        if (Math.abs(nearest_center.dist_y) >= this.snap_threshold && Math.abs(-nearest_center.dist_y + diff_y) < this.snap_threshold) {
            diff_y = nearest_center.dist_y;
        } else if (Math.abs(nearest_center.dist_y) < this.snap_threshold && Math.abs(diff_y) < this.snap_threshold) {
            diff_y = 0;
        }
    }
    this.move_shapes(shapes, diff_x, diff_y);
    return {x: diff_x, y: diff_y};
};

CanvasManager.prototype.move_shapes = function(shapes, diff_x, diff_y) {
    var moved_shapes = [];
    var i;
    // move shapes
    for (i = 0; i < shapes.length; i++) {
        shapes[i].translate(diff_x, diff_y);
        moved_shapes.push(shapes[i]);
    }
    for (i = 0; i < this.arrows.length; i++) {
        moved_shapes.push(this.arrows[i]);
    }
    for (i = 0; i < this.arrows.length; i++) {
        this.arrows[i].linked_shapes_moved(diff_x, diff_y, moved_shapes);
    }
    this.draw_required = true;
};

CanvasManager.prototype.show_message = function(msg, slow) {
    var fade_out_time = 500;
    if (slow) {
        fade_out_time = 1000;
    }

    var canvas_overlay = $("#canvas_overlay");
    $(canvas_overlay).find("h1").text(msg);
    $(canvas_overlay).stop();
    $(canvas_overlay).fadeIn(30);
    $(canvas_overlay).fadeOut(fade_out_time);
};


CanvasManager.prototype.show_full_details = function(checked) {
    for (var s = 0; s < this.selected_shapes.length; s++) {
        if (checked) {
            this.selected_shapes[s].full();
        } else {
            this.selected_shapes[s].partial();
        }
    }
    for (var i = 0; i < this.arrows.length; i++) {
        this.arrows[i].linked_shapes_moved(0, 0, this.selected_shapes);
    }
    this.draw_required = true;
};



CanvasManager.prototype.nearest_shape_center = function(p) {
    var unselected_shapes = this.get_unselected_shapes();
    var dist_x = Infinity;
    var dist_y = Infinity;
    for (var i = 0; i < unselected_shapes.length; i++) {
        var shape_center = unselected_shapes[i].get_center();
        if (Math.abs(p.x - shape_center.x) < Math.abs(dist_x)) {
            dist_x = p.x - shape_center.x;
        }
        if (Math.abs(p.y - shape_center.y) < Math.abs(dist_y)) {
            dist_y = p.y - shape_center.y;
        }
    }
    return {dist_x: -dist_x, dist_y: -dist_y};
};


CanvasManager.prototype.get_bounding_box_over_all_shapes = function() {
    var min_x = this.canvas.width;
    var max_x = 0;
    var min_y = this.canvas.height;
    var max_y = 0;
    for (var s = 0; s < this.shapes.length; s++) {
        for (var v = 0; v < this.shapes[s].vertices.length; v++) {
            if (this.shapes[s].vertices[v].x < min_x) {
                min_x = this.shapes[s].vertices[v].x;
            }
            if (this.shapes[s].vertices[v].x > max_x) {
                max_x = this.shapes[s].vertices[v].x;
            }
            if (this.shapes[s].vertices[v].y < min_y) {
                min_y = this.shapes[s].vertices[v].y;
            }
            if (this.shapes[s].vertices[v].y > max_y) {
                max_y = this.shapes[s].vertices[v].y;
            }
        }
    }
    for (var s = 0; s < this.arrows.length; s++) {
        for (var v = 0; v < this.arrows[s].vertices.length; v++) {
            if (this.arrows[s].vertices[v].x < min_x) {
                min_x = this.arrows[s].vertices[v].x;
            }
            if (this.arrows[s].vertices[v].x > max_x) {
                max_x = this.arrows[s].vertices[v].x;
            }
            if (this.arrows[s].vertices[v].y < min_y) {
                min_y = this.arrows[s].vertices[v].y;
            }
            if (this.arrows[s].vertices[v].y > max_y) {
                max_y = this.arrows[s].vertices[v].y;
            }
        }
    }
    return {min_x: min_x, max_x: max_x, min_y: min_y, max_y: max_y};
};

/////////////////////////////
//  Building the graph

CanvasManager.prototype.find_connected_arrows = function(shapes) {
    var i;
    var connected_arrows = [];
    for (i = 0; i < this.arrows.length; i++) {
        var arrow = this.arrows[i];
        var result = arrow.shapes_are_linked(shapes);
        if (result[0] || result[1]) {
            connected_arrows.push(arrow);
        }
    }
    return connected_arrows;
};


CanvasManager.prototype.find_preceding_arrows = function(shapes) {
    var i;
    var connected_arrows = [];
    for (i = 0; i < this.arrows.length; i++) {
        var arrow = this.arrows[i];
        var result = arrow.shapes_are_linked(shapes);
        if (result[1]) {
            connected_arrows.push(arrow);
        }
    }
    return connected_arrows;
};

CanvasManager.prototype.find_preceding_shapes = function(shape) {
    var i;
    var preceding_shapes = [];
    var preceding_arrows = [];
    // get all preceding arrows
    var temp_preceding_arrows = this.find_preceding_arrows([shape]);
    while (temp_preceding_arrows.length > 0) {
        for (i = 0; i < temp_preceding_arrows.length; i++) {
            preceding_arrows.push(temp_preceding_arrows[i]);
        }
        temp_preceding_arrows = this.find_preceding_arrows(temp_preceding_arrows);
    }

    // get all preceding shapes
    for (i = 0; i < preceding_arrows.length; i++) {
        var arrow = this.arrows[i];
        var result = arrow.shapes_are_linked(this.shapes);
        if (result[0] && result[0].type != "Line") {
            preceding_shapes.push(result[0]);
        }
    }

    return preceding_shapes;
};

CanvasManager.prototype.to_graph = function() {
    var i;
    var j;
    var graph = {};
    for (i = 0; i < this.shapes.length; i++) {
        var shape = this.shapes[i];
        graph[shape.key] = shape.layer;
        graph[shape.key].input_layers = [];
        var preceding_shapes = this.find_preceding_shapes(shape);
        for (j = 0; j < preceding_shapes.length; j++) {
            graph[shape.key].input_layers.push(preceding_shapes[j].key);
        }
    }
    return graph;
};

/**
 * Created by icaspi on 1/30/2017.
 */

var layer_types = {
    "DataPlaceholder": {
        "id": "#dataParams",
        "short_name": "data"
    },
    "Pooling": {
        "id": "#poolingParams",
        "short_name": "pool",
        "subtype_selector_id": "#poolingType",
        "subtypes": {"MaxPooling": {"id": "#maxPoolingParams"},
            "AveragePooling": {"id": "#averagePoolingParams"},
            "StochasticPooling": {"id": "#stochasticPoolingParams"}}},
    "Convolution": {
        "id": "#convolutionParams",
        "short_name": "conv"},
    "Deconvolution": {
        "id": "#deconvolutionParams",
        "short_name": "deconv"},
    "Activation": {
        "id": "#activationParams",
        "short_name": "activation",
        "subtype_selector_id": "#activationType",
        "subtypes": {"ReLU": {"id": "#reluParams"},
            "ReLU6": {"id": "#relu6Params"},
            "LeakyReLU": {"id": "#leakyReluParams"},
            "ParametericReLU": {"id": "#parametericReluParams"},
            "ELU": {"id": "#eluParams"},
            "Sigmoid": {"id": "#sigmoidParams",
                "short_name": "σ"},
            "HardSigmoid": {"id": "#hardSigmoidParams"},
            "TanH": {"id": "#tanhParams",
                "short_name": "tanh"},
            "Softmax": {"id": "#softmaxParams"},
            "Softsign": {"id": "#softsignParams"},
            "Softplux": {"id": "#softplusParams"}}},
    "Normalization": {
        "id": "#normalizationParams",
        "short_name": "norm",
        "subtype_selector_id": "#normalizationType",
        "subtypes": {"LocalResponseNormalization": {"id": "#localResponseNormalizationParams"},
            "BatchNormalization": {"id": "#batchNormalizationParams"},
            "L2Normalization": {"id": "#l2NormalizationParams"}}},
    "Regularization": {
        "id": "#regularizationParams",
        "short_name": "regularize",
        "subtype_selector_id": "#regularizationType",
        "subtypes": {"Dropout": {"id": "#dropoutParams"},
            "Maxout": {"id": "#maxoutParams"},
            "Zoneout": {"id": "#zoneoutParams"},
            "DropConnect": {"id": "#dropConnectParams"}}},
    "DataManipulation": {
        "id": "#dataManipulationParams",
        "short_name": "manipulate",
        "subtype_selector_id": "#dataManipulationType",
        "subtype": {"Reshape": {"id": "#reshapeParams"},
            "Concatenate": {"id": "#concatenateParams"},
            "Flatten": {"id": "#flattenParams"},
            "Permute": {"id": "#permuteParams"}}},
    "ElementWise": {
        "id": "#elementWiseParams",
        "short_name": "+",
        "subtype_selector_id": "#elementWiseType",
        "subtype": {"Add": {"id": "#addParams"},
            "Multiply": {"id": "#multiplyParams"}}},
    "Stochastic": {
        "id": "#stochasticParams",
        "short_name": "stochastic",
        "subtype": {"GaussianNoise": {"id": "#gaussianParams"},
            "UniformNoise": {"id": "#uniformParams"},
            "GumbleSoftmax": {"id": "#gumbleSoftmaxParams"}}},
    "InnerProduct": {"id": "#innerProductParams", "short_name": "fc"},
    "SpecialBlock": {"id": "#specialBlockParams", "short_name": "special"},
    "Recurrent": {"id": "#recurrentParams", "short_name": "recurrent"},
    "Advanced": {
        "id": "#advancedParams",
        "short_name": "advanced",
        "subtype": {"Memory": {"id": "#memoryParams"},
            "Attention": {"id": "#attentionParams"}}}
};


var SidebarManager = function() {
    this.modes = ["before", "designer", "share_explore", "account", "after"];
    this.mode_icons = [];
    for (var key = 0; key < this.modes.length; key++) {
        this.mode_icons.push($("#" + this.modes[key] + "_icon"));
    }
    this.add_layer_icon = $("#addLayerIcon");
    this.layer_name = $("#layerName");
    this.full_details_switch = $("#fullDetails");
    this.layer_type = $("#layerType");
};

SidebarManager.prototype.change_selected_color = function(color_idx) {
    for (var i = 0; i < 6; i++) {
        var color_element = $('#color' + i.toString());
        if (i == color_idx) {
            $(color_element).html('<i class="glyphicon glyphicon-ok" style="margin-top: 3px;margin-left:50%;left:-8px;color:rgba(255,255,255,0.7)"></i>');
        } else {
            $(color_element).html('');
        }
    }
};

SidebarManager.prototype.toggle_add_or_remove_button = function() {
    if ($(this.add_layer_icon).attr('data-original-title') == "Add") {
        $(this.add_layer_icon).attr('data-original-title', "Remove");
    } else {
        $(this.add_layer_icon).attr('data-original-title', "Add");
    }
    $(this.add_layer_icon).toggleClass('rotated');
};


SidebarManager.prototype.set_add_or_remove_button_to_add = function() {
    if ($(this.add_layer_icon).hasClass('rotated')) {
        this.toggle_add_or_remove_button();
    }
};

SidebarManager.prototype.set_add_or_remove_button_to_remove = function() {
    if (!$(this.add_layer_icon).hasClass('rotated')) {
        this.toggle_add_or_remove_button();
    }
};

SidebarManager.prototype.set_layer_name = function(text) {
    $(this.layer_name).val(text);
};

SidebarManager.prototype.focus_layer_name = function() {
    setTimeout(function () {
        $(this.layer_name).focus();
    }, 1);
};

SidebarManager.prototype.set_full_details_switch = function(value) {
    $(this.full_details_switch)[0].checked = value;
};


SidebarManager.prototype.switch_sidebar_mode = function(mode) {
    //switch the sidebar mode
    var key;
    for (key = 0; key < this.modes.length; key++) {
        $(this.mode_icons[key]).parent('div').removeClass("wrapping-side-icon");
        $(this.mode_icons[key]).removeClass("before-side-icon");
        $(this.mode_icons[key]).removeClass("selected-side-icon");
        $(this.mode_icons[key]).removeClass("after-side-icon");
    }
    for (key = 0; key <= this.modes.length; key++) {
        if (this.modes[key] == mode) {
            $(this.mode_icons[key-1]).parent('div').addClass("wrapping-side-icon");
            $(this.mode_icons[key-1]).addClass("before-side-icon");
            $(this.mode_icons[key]).addClass("selected-side-icon");
            $(this.mode_icons[key+1]).addClass("after-side-icon");
            $(this.mode_icons[key+1]).parent('div').addClass("wrapping-side-icon");
            $("#" + this.modes[key]).fadeIn("fast");
        } else {
            $("#" + this.modes[key]).hide();
        }
    }
    if (mode == "share_explore") {
        $("#canvas_explore").fadeIn();
        $('.grid').masonry({
            // options
            itemSelector: '.grid-item',
            columnWidth: 100
        });
        $(".grid").removeClass("fadeOutDown");
        $(".grid").addClass("fadeInUp");
        $('.grid-item').hover(
            function(){ $(this).addClass('pulse') },
            function(){ $(this).removeClass('pulse') }
        )
        $(".canvas").addClass("blur");
        $("#canvas_keys").addClass("blur");
        // $("#sidebar_container").removeClass("col-xs-2").addClass("col-xs-3", "slow");
        // $("#canvas_container").removeClass("col-xs-9").addClass("col-xs-8", "slow");
    } else {
        $(".canvas").removeClass("blur");
        $("#canvas_keys").removeClass("blur");
        $(".grid").removeClass("fadeInUp");
        $(".grid").addClass("fadeOutDown");
        $("#canvas_explore").fadeOut();
        // $("#sidebar_container").removeClass("col-xs-3").addClass("col-xs-2", "slow");
        // $("#canvas_container").removeClass("col-xs-8").addClass("col-xs-9", "slow");
    }

};


SidebarManager.prototype.start = function(fast) {
    if (fast) {
        $("#welcome_screen_container").hide();
        $("#sidebar_icons_container").show();
        $("#sidebar_container").show();
    } else {
        $("#welcome_screen_container").addClass("fadeOut");
        $("#welcome_screen_container").fadeOut("slow");
        // $('.main').css({
        //     '-webkit-filter':'none',
        //     '-moz-filter':'none',
        //     '-o-filter':'none',
        //     '-ms-filter':'none',
        //     'filter':'none',
        // });
        $("#sidebar_icons_container").fadeIn("slow");
        // $("#sidebar_icons_container").addClass("fadeInLeft");
        $("#sidebar_container").fadeIn("slow");
        $("#sidebar_container").addClass("fadeInLeft");
    }

};



SidebarManager.prototype.switch_layer_type = function(layerType, layerSubtype) {
    var key;
    // close all other than the given type
    for (key in layer_types) {
        if (layerType == key) {
            $(layer_types[key]["id"]).show("fast");
        } else {
            $(layer_types[key]["id"]).hide("fast");
        }
        // choose subtype
        for (var subtype_key in layer_types[key]["subtypes"]) {
            if (layerSubtype == subtype_key) {
                $(layer_types[key]["subtypes"][subtype_key]["id"]).show("fast");
            } else {
                $(layer_types[key]["subtypes"][subtype_key]["id"]).hide("fast");
            }
        }
    }
};

SidebarManager.prototype.select_layer_type = function() {
    // open the parameters section for the selected layer type only
    var layerType = $(this.layer_type).val();
    var layerSubtype = $(layer_types[layerType]["subtype_selector_id"]).val();
    this.switch_layer_type(layerType, layerSubtype);
};


SidebarManager.prototype.change_selected_layer_type = function(layerType, layerSubtype) {
    $(this.layer_type).val(layerType);
    $(layer_types[layerType]["subtype_selector_id"]).val(layerSubtype);
};


