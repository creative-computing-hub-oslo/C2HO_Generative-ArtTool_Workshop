/* 
Copyright 2023 Stevan Dedovic

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// coordinate => number         => 1, 2, 3, -5, 1.2, -9.3
// point      => 2-list coords  => [0, 0], [-3, 2.3]
// triangle   => 3-list point   => [[0, 0], [2, -2], [1.5, 6]]

const defaultTri = [[0.1, 0.1], [0.1, 0.9], [0.9, 0.1]];
const black = [0, 0, 0];
const white = [0, 0, 100];

const colorPalette = [
  [322, 63, 100],
  [2, 79, 41],
  [54, 38, 100],
  [107, 46, 31]
];

function setup() {
  colorMode(HSB, 360, 100, 100, 1.0);
  createCanvas(700, 700);
  
  background.apply(null, white);
}

// Converts the normalised canvas coordinate [0, 1] to pixel coord [0, width]
function w(val) {
  return val * width;
}

// Converts the normalised canvas coordinate [0, 1] to pixel coord [0, width]
function h(val) {
  return val * height;
}

// Return whether or not two floats are equal (enough)
function equalf(a, b) {
  return Math.abs(a - b) < Number.EPSILON;
}

// takes in a triangle, returns two new triangles by subdividing the original
function subdivide(tri) {
  const [[ax, ay], [bx, by], [cx, cy]] = tri;
  // step 1 - find the lengths of the sides
  const lenAB = dist(ax, ay, bx, by);
  const lenBC = dist(bx, by, cx, cy);
  const lenCA = dist(cx, cy, ax, ay);
  
  // step 2 - find the longest side
  const lenLongest = Math.max(lenAB, lenBC, lenCA);
  
  // Helper Function
  // Subdivide the triangle ABC along side AB
  // Returns two new triangles.
  const subdivideAB = (a, b, c) => {
    const [ax, ay] = a;
    const [bx, by] = b;
    
    const r = randomGaussian(0.5, 0.08);
    const mx = lerp(ax, bx, r);
    const my = lerp(ay, by, r);
    const p = [mx, my];
    
    return [
      [p, a, c],
      [p, b, c]
    ];
  }
  
  // step 3 - split tri into two along longest side
  const [a, b, c] = tri;
  if (equalf(lenAB, lenLongest)) {
    return subdivideAB(a, b, c);
  }
  if (equalf(lenBC, lenLongest)) {
    return subdivideAB(b, c, a);
  }
  if (equalf(lenCA, lenLongest)) {
    return subdivideAB(c, a, b);
  }
}

function offset(tri, amount) {
  const [[x1, y1], [x2, y2], [x3, y3]] = tri;
  
  // find the centroid
  const cx = (x1 + x2 + x3) / 3;
  const cy = (y1 + y2 + y3) / 3;
  
  const lenLongest = Math.max(
    dist(x1, y1, cx, cy),
    dist(x2, y2, cx, cy),
    dist(x3, y3, cx, cy)
  );
  
  const moveToward = (px, py, tx, ty) => {
    const theta = atan2(ty - py, tx - px);
    
    const len = dist(px, py, tx, ty);
    const scaleFactor = len / lenLongest;
    
    return [
      px + amount * scaleFactor * cos(theta),
      py + amount * scaleFactor * sin(theta)
    ];
  };
  
  return [
    moveToward(x1, y1, cx, cy),
    moveToward(x2, y2, cx, cy),
    moveToward(x3, y3, cx, cy),
  ];
}

function fmod(x, y) {
  return x - (Math.floor(x / y) * y);
}

const density = 500;
const rez = 0.001;
function paintLine(a, b) {
  const [x1, y1] = a;
  const [x2, y2] = b;
  const len = dist(x1, y1, x2, y2);
  
  if (len < 0.007) {
    return;
  }
  
  const numGrains = len * density;
  for(let i = 0; i < numGrains; i++) {
    const r = random() + frameCount * 0.01;
    const n = fmod(noise(x1 * rez, y1 * rez, r) * 30, 1.0);
    
    const px = lerp(x1, x2, n);
    const py = lerp(y1, y2, n);
    
    point(w(px), h(py));
  }
}

let toDraw = [defaultTri];
let shouldDraw = true;

function draw() {
  // background(0, 0, 90);
  strokeWeight(w(0.001));
  
  noFill();
  
  if (keyIsDown(74)) { // "j"
    toDraw = toDraw.map(tri => offset(tri, 0.001));
  }
  if (keyIsDown(75)) { // "k"
    toDraw = toDraw.map(tri => offset(tri, -0.001));
  }
  
  if (shouldDraw) {
    for(tri of toDraw) {
      const [a, b, c] = tri;
      paintLine(a, b);
      paintLine(b, c);
      paintLine(c, a);
    }
  }
}

function keyPressed() {
  // "0"
  if (keyCode == 48) {
    stroke.apply(null, [...black, 0.1]);
  }
  
  // "1" - "9"
  if (keyCode >= 49 && keyCode <= 57) {
    const idx = Math.min(keyCode - 49, colorPalette.length - 1);
    const currentColor = [...colorPalette[idx], 0.1];
    stroke.apply(null, currentColor);
  }
  
  if (key === 's') {
    toDraw = toDraw.flatMap(subdivide);
  }
  
  if (key === 'd') {
    shouldDraw = !shouldDraw;
  }
  
  // RESET
  if (key === 'r') {
    shouldDraw = true;
    toDraw = [defaultTri];
    background(0, 0, 100);
    stroke.apply(null, [...black, 0.1]);
  }
}


