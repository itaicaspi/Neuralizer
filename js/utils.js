/**
 * Created by Itai Caspi on 26/07/2016.
 */

/////////////////////////////////////////
//  Color


var Color = function(r, g, b, a) {
    if (typeof r == "object") {
        var color = r;
        r = color.r;
        g = color.g;
        b = color.b;
        a = color.a;
    }
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
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
    this.x = parseFloat(x);
    this.y = parseFloat(y);
    this.z = parseFloat(z);

    this.key = new Uint32Array(1);
    window.crypto.getRandomValues(this.key);
    this.key = (typeof key != 'undefined') ? key : this.key[0];
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