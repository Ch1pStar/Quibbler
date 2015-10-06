/**
 * 2d Vector Math Utils
*/
function Vec2(){};
Vec2.create = function(a, b) {
  return new Float32Array([a, b]);
} 

Vec2.add = function(a, b, out) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
}

Vec2.subtract = function(a, b, out) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
}

Vec2.scale = function(a, v, out) {
  out[0] = a[0] * v;
  out[1] = a[1] * v;
}

Vec2.normalize = function(a, out) {
  if(a[0]==0 && a[1]==0){
    return;
  }
  var iLen = 1 / Vec2.len(a);
  out[0] = a[0] * iLen;
  out[1] = a[1] * iLen;
}

Vec2.limit = function(a, limit, out){
  Vec2.limit2(a, limit*limit, out);
}

Vec2.limit2 = function(a, limit2, out){
  var len2 = Vec2.len2(a);
  if(len2 > limit2){
    Vec2.scale(a, Math.sqrt(limit2/len2), out);
  }
  out = a;
}

Vec2.len = function(a) {
  return Math.sqrt((a[0] * a[0]) + (a[1] * a[1]));
}

Vec2.len2 = function(a){
  return a[0] * a[0] + a[1] * a[1];
}

Vec2.vectorToAngle = function(a) {
  return Math.atan2(-a[0], a[1]);
}

Vec2.angleToVector = function(angle, out) {
  out[0] = Math.sin(angle);
  out[1] = Math.cos(angle);
}

Vec2.normalizeAngle = function(angle){
  angle = angle % (2*Math.PI);
  if(angle < 0){
    angle += (2*Math.PI);
  }
  return angle;
}

Vec2.PI2 = Math.PI * 2;

Vec2.wrapAngleAroundZero = function (a) {
  if (a >= 0) {
    var rotation = a % Vec2.PI2;
    if (rotation > Math.PI) rotation -= Vec2.PI2;
    return rotation;
  } else {
    var rotation = -a % Vec2.PI2;
    if (rotation > Math.PI) rotation -= Vec2.PI2;
    return -rotation;
  }
}


module.exports = Vec2;