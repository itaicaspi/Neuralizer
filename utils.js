/**
 * Created by Itai Caspi on 26/07/2016.
 */

/////////////////////////////////////////
//  Color


var Color = function(color) {
    this.r = color.r;
    this.g = color.g;
    this.b = color.b;
    this.a = color.a;
};

var Color = function(r, g, b, a) {
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


/////////////////////////////////////////
//  Vertex - a 3D point in space

var Vertex = function (x, y, z) {
    this.x = parseFloat(x);
    this.y = parseFloat(y);
    this.z = parseFloat(z);
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