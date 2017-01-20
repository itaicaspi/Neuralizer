/**
 * Created by Itai Caspi on 28/07/2016.
 */

var inheritsFrom = function (child, parent) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
};

var Line = function(vertices, radius, color, stroke) {
    this.vertices = vertices;
    this.default_color = color;
    this.color = color;
    this.border_color = color;
    this.stroke = (typeof stroke != 'undefined') ? stroke : 1;
    this.radius = (typeof radius != 'undefined') ? radius : 2;
    this.points = 0;
    this.linkStart = [];
    this.linkEnd = [];
	this.startDir = [];
    this.endDir = [];
    this.type = "Line";
};

Line.prototype.shapes_are_linked = function(shapes) {
	var is_start = false;
	var is_end = false;
	for (var i = 0; i < shapes.length; i++) {
		if (this.linkStart == shapes[i]) {
            is_start = true;
        }
        if (this.linkEnd == shapes[i]) {
            is_end = true;
        }
	}
	return [is_start, is_end]
};


Line.prototype.linked_shapes_moved = function(dx, dy, shapes) {
	
	var results = this.shapes_are_linked(shapes);
	var start_moved = results[0];
	var end_moved = results[1];
	//if (shape != "Line") {
        
		if (start_moved && end_moved) {
			this.move(dx,dy);
		} else {		
			if (start_moved) {
				this.move_start(dx, dy);
			}
			if (end_moved) {
				this.move_end(dx, dy);
			}
		}
    //} else {

    //}
};

Line.prototype.linked_shape_color_change = function(shape, arrows) {
    if (this.linkStart == shape) {
        this.color = shape.border_color;
        this.border_color = shape.border_color;
        this.default_color = shape.border_color;
        for (var a = 0; a < arrows.length; a++) {
            arrows[a].linked_shape_color_change(this, arrows);
        }
    }
};

Line.prototype.startLine = function(start, color, linkStart, startDir) {
    this.points++;
    this.vertices[0] = start;
    this.color = color;
    this.border_color = color;
    this.linkStart = linkStart;
	this.startDir = startDir;
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
    this.linkEnd = linkEnd;
    var lastIdx = this.points-1;
    // close a line
    if (Math.abs(this.vertices[lastIdx].y - end.y) > 3 || Math.abs(this.vertices[lastIdx].x - end.x) > 3) {
        if (this.vertices[lastIdx].y == this.vertices[lastIdx-1].y) {
            this.vertices[lastIdx+1] = new Vertex(this.vertices[lastIdx].x, end.y, 0);
        } else {
            this.vertices[lastIdx+1] = new Vertex(end.x, this.vertices[lastIdx].y, 0);
        }
    } else if (this.points > 2) {
        this.points--;
    }
    this.points = this.vertices.length;
    lastIdx = this.points-1;
    if (this.vertices[lastIdx].y == this.vertices[lastIdx-1].y) {
        this.endDir = "horizontal";
    } else {
        this.endDir = "vertical";
    }
    this.linkEnd = linkEnd;
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
        ctx.strokeStyle = this.border_color.to_string();
        ctx.lineWidth = this.stroke;
        ctx.stroke();
    }

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

    if (this.linkStart.type == "Line") {
        ctx.beginPath();
        ctx.arc(this.vertices[0].x, this.vertices[0].y, 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = this.border_color.to_string();
        ctx.fill();
    }
};

Line.prototype.move = function(dx, dy) {
	for (var v = 0; v < this.vertices.length; v++) {
		this.vertices[v].x += dx;
        this.vertices[v].y += dy;
	}
};

Line.prototype.move_start = function(dx, dy) {
    var startDir;
    if (this.endDir == "vertical" && this.points % 2 == 1) startDir = "horizontal";
    else if (this.endDir == "vertical" && this.points % 2 == 0) startDir = "vertical";
    else if (this.endDir == "horizontal" && this.points % 2 == 1) startDir = "vertical";
    else if (this.endDir == "horizontal" && this.points % 2 == 0) startDir = "horizontal";

    if (this.points > 2) {
        if (startDir == "vertical") this.vertices[1].x += dx;
        if (startDir == "horizontal") this.vertices[1].y += dy;
        this.vertices[0].x += dx;
        this.vertices[0].y += dy;
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
        }
        this.vertices = newVertices;
        this.points = this.vertices.length;
    }
};

Line.prototype.move_end = function(dx, dy) {
    var last = this.vertices.length-1;
    if (this.points > 2 || (this.endDir == "horizontal" && dy == 0) || (this.endDir == "vertical" && dx == 0)) {
        if (this.endDir == "vertical") this.vertices[last - 1].x += dx;
        if (this.endDir == "horizontal") this.vertices[last - 1].y += dy;
        this.vertices[last].x += dx;
        this.vertices[last].y += dy;
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
        }
        this.vertices = newVertices;
        this.points = this.vertices.length;
    }
};

Line.prototype.pointer_is_on_the_border = function(xm, ym, ctx) {
    var relevant = false;
    var pixelColor = ctx.getImageData(xm - this.stroke, ym - this.stroke, this.stroke*2, this.stroke*2).data;
    for (var i = 0; i < 4*this.stroke*this.stroke; i++) {
        if (pixelColor[i*3] == this.border_color.r && pixelColor[i*3+1] == this.border_color.g && pixelColor[i*3+2] == this.border_color.b) {
            relevant = true;
            break;
        }
    }

    if (relevant == false) return false;

    for (i = 0; i < this.vertices.length; i++) {
        var vi = this.vertices[i];
        var vj = this.vertices[(i + 1) % this.vertices.length];
        // check between points
        if (((ym <= vi.y + this.stroke && ym >= vj.y) || (ym >= vi.y && ym <= vj.y)) &&
            ((xm <= vi.x && xm >= vj.x) || (xm >= vi.x && xm <= vj.x))) {
            // vertical lines
            if (vi.x == vj.x && (xm <= vi.x + this.stroke) && (xm >= vi.x - this.stroke)) {
                return "vertical";
            }
            var m = (vj.y - vi.y) / (vj.x - vi.x);
            // other lines
            if ((ym - m*(xm - vi.x) - vi.y <= this.stroke) && (ym - m*(xm - vi.x) - vi.y >= -this.stroke)) {
                return "horizontal";
            }
        }
    }
    return false;
};

//////////////////////////////////
//  Shape


var Shape = function(x, y, width, height, radius, stroke, text, color, border_color, dashedBorder) {
    this.x = x;
    this.y = y;
    this.baseWidth = width;
    this.width = width;
    this.height = height;
    this.radius = (typeof radius != 'undefined') ? radius : 2;
    this.stroke = (typeof stroke != 'undefined') ? stroke : 1;
	this.textColor = "white";
    this.default_color = Object.create(color);
    this.color = Object.create(color);
	this.default_border_color = Object.create(border_color);
    this.border_color = Object.create(border_color);
    this.vertices = [];
	this.dashedBorder = (typeof dashedBorder != 'undefined') ? dashedBorder : false;
	this.update_text((typeof text != 'undefined') ? text : "");
	
};

Shape.prototype.update_vertices = function() {
};


Shape.prototype.pointer_is_inside = function(xm, ym) {
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
    var relevant = false;
    var pixelColor = ctx.getImageData(xm - this.stroke, ym - this.stroke, this.stroke*2, this.stroke*2).data;
    for (var i = 0; i < 4*this.stroke*this.stroke; i++) {
        if (pixelColor[i*3] == this.border_color.r && pixelColor[i*3+1] == this.border_color.g && pixelColor[i*3+2] == this.border_color.b) {
            relevant = true;
            break;
        }
    }

    if (relevant == false) return false;

    for (i = 0; i < this.vertices.length; i++) {
        var vi = this.vertices[i];
        var vj = this.vertices[(i + 1) % this.vertices.length];
        // check between points
        if (((ym <= vi.y + this.stroke && ym >= vj.y) || (ym >= vi.y - this.stroke && ym <= vj.y + this.stroke)) &&
            ((xm <= vi.x + this.stroke && xm >= vj.x - this.stroke) || (xm >= vi.x - this.stroke && xm <= vj.x + this.stroke))) {
            // vertical lines
            if (vi.x == vj.x && (xm <= vi.x + this.stroke) && (xm >= vi.x - this.stroke)) {
                return "vertical";
            } else if (vi.y == vj.y && (ym <= vi.y + this.stroke) && (ym >= vi.y - this.stroke)) {
				return "horizontal";
			}
			
            var m = (vj.y - vi.y) / (vj.x - vi.x);
            // other lines
            if ((ym - m*(xm - vi.x) - vi.y <= this.stroke) && (ym - m*(xm - vi.x) - vi.y >= -this.stroke)) {
                return true;
            }
        }
    }
    return false;
};

Shape.prototype.translate = function(dx, dy) {
    for (var i = 0; i < this.vertices.length; i++) {
        this.vertices[i].x += dx;
        this.vertices[i].y += dy;
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
    this.color = color;
	//this.default_color = color;
};

Shape.prototype.change_border_color = function(color) {
    this.border_color = color;
	this.default_border_color = color;
};


/////////////////////////////////////
//  Rectangle

var Rectangle = function(x, y, width, height, radius, offset, stroke, text, color, border_color, dashedBorder) {
    Shape.call(this, x, y, width, height, radius, stroke, text, color, border_color, dashedBorder);
    this.offset = (typeof offset != 'undefined') ? offset : 10;
    this.update_vertices();
    this.type = "Rectangle";
};

inheritsFrom(Rectangle, Shape);

Rectangle.prototype.update_vertices = function() {
    this.vertices = [
        new Vertex(this.x, this.y, 0),
        new Vertex(this.x + this.width, this.y, 0),
        new Vertex(this.x + this.width - this.offset, this.y + this.height, 0),
        new Vertex(this.x - this.offset, this.y + this.height, 0)
    ];
};

Rectangle.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.x + this.radius, this.y);
    ctx.lineTo(this.x + this.width - this.radius, this.y);
    ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + this.radius);
    ctx.lineTo(this.x + this.width - this.offset, this.y + this.height - this.radius);
    ctx.quadraticCurveTo(this.x + this.width - this.offset, this.y + this.height, this.x + this.width - this.radius - this.offset, this.y + this.height);
    ctx.lineTo(this.x + this.radius - this.offset, this.y + this.height);
    ctx.quadraticCurveTo(this.x - this.offset, this.y + this.height, this.x - this.offset, this.y + this.height - this.radius);
    ctx.lineTo(this.x, this.y + this.radius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + this.radius, this.y);
    ctx.closePath();

    // draw fill
    ctx.fillStyle = this.color.to_string();
    ctx.fill();
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
    // draw text
    ctx.font="14px Calibri";
    ctx.textAlign="center";
    ctx.fillStyle = this.textColor;
    ctx.fillText(this.text,this.x+(this.width-this.offset)/2,this.y+this.height/2+3);
};

/////////////////////////////////////
//  Triangle

var Triangle = function(x, y, width, height, radius, stroke, color, border_color) {
    Shape.call(this, x, y, width, height, radius, stroke, "", color, border_color);
    this.update_vertices();
    this.type = "Triangle";
};

inheritsFrom(Triangle, Shape);

Triangle.prototype.update_vertices = function() {
    this.vertices = [
        new Vertex(this.x, this.y, 0),
        new Vertex(this.x + this.width, this.y + this.height/2, 0),
        new Vertex(this.x, this.y + this.height, 0)
    ];
};


Triangle.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.x + this.radius, this.y);
    ctx.lineTo(this.x + this.width - this.radius, this.y + this.height/2 - this.radius);
    ctx.quadraticCurveTo(this.x + this.width, this.y + this.height/2, this.x + this.width - this.radius, this.y + this.height/2 + this.radius);
    ctx.lineTo(this.x + this.radius, this.y + this.height);
    ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - this.radius);
    ctx.lineTo(this.x, this.y + this.radius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + this.radius, this.y);
    ctx.closePath();

    // draw fill
    ctx.fillStyle = this.color.to_string();
    ctx.fill();
    // draw border
    if (this.stroke > 0) {
        ctx.strokeStyle = this.border_color.to_string();
        ctx.lineWidth = this.stroke;
        ctx.stroke();
    }
};

/////////////////////////////////////
//  Circle

var Circle = function(x, y, radius, stroke, text, color, border_color) {
    Shape.call(this, x + radius, y + radius, radius, radius, radius, stroke, text, color, border_color);
    this.vertices = [];
    this.type = "Circle";
};

inheritsFrom(Circle, Shape);

Circle.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    // draw fill
    ctx.fillStyle = this.color.to_string();
    ctx.fill();
    // draw border
    if (this.stroke > 0) {
        ctx.strokeStyle = this.border_color.to_string();
        ctx.lineWidth = this.stroke;
        ctx.stroke();
    }

    // draw text
    ctx.font="14px Calibri";
    ctx.textAlign="center";
    ctx.fillStyle = this.textColor;
    ctx.fillText(this.text,this.x, this.y + 3);
};

Circle.prototype.pointer_is_inside = function(xm, ym) {
    return (Math.sqrt(Math.pow(xm-this.x, 2) + Math.pow(ym-this.y,2)) < this.radius);
};

Circle.prototype.pointer_is_on_the_border = function(xm, ym, ctx) {
    var relevant = false;
    var pixelColor = ctx.getImageData(xm - this.stroke, ym - this.stroke, this.stroke*2, this.stroke*2).data;
    for (var i = 0; i < 4*this.stroke*this.stroke; i++) {
        if (pixelColor[i*3] == this.border_color.r && pixelColor[i*3+1] == this.border_color.g && pixelColor[i*3+2] == this.border_color.b) {
            relevant = true;
            break;
        }
    }

    if (relevant == false) return false;

    return (Math.sqrt(Math.pow(xm-this.x, 2) + Math.pow(ym-this.y,2)) < this.radius + 3 &&
            Math.sqrt(Math.pow(xm-this.x, 2) + Math.pow(ym-this.y,2)) > this.radius - 3);
};

Circle.prototype.update_text = function(text) {
    var textWidth = text.length * 7;
    this.text = text;
    if (textWidth/2 > this.baseWidth) {
        this.radius = textWidth/2;
    } else {
        this.radius = this.baseWidth;
    }
};