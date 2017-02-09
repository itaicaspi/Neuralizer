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
