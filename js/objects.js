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