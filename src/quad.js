/**
 * @typedef {Object} Quad
 * @property {Voronoi.Cell} cell - The Voronoi cell associated with the quad.
 * @property {[Voronoi.Edge, Voronoi.Edge, Voronoi.Edge, Voronoi.Edge]} edges - The four edges that form the quad.
 * @property {number} id - The unique identifier for the quad.
 * @property {[Quad, Quad, Quad, Quad]} neighbours - The four neighboring quads.
 * @property {Voronoi.Vertex} site - The Voronoi vertex (site) associated with the quad.
 * @property {[Voronoi.Vertex, Voronoi.Vertex, Voronoi.Vertex, Voronoi.Vertex]} vertices - The four vertices of the quad.
 */

/**
 *
 * @param {Voronoi.Vertex} point
 * @param {Quad} quad
 * @returns
 */
function isPointInQuad(point, quad) {
  const vertices = quad.vertices;

  let totalAngle = 0;

  // Loop through each pair of consecutive vertices (forming vectors to the point)
  for (let i = 0; i < vertices.length; i++) {
    const v1 = createVector(vertices[i].x - point.x, vertices[i].y - point.y);
    const v2 = createVector(
      vertices[(i + 1) % vertices.length].x - point.x,
      vertices[(i + 1) % vertices.length].y - point.y
    );
    const angle = angleBetween(v1, v2);
    totalAngle += angle;
  }

  // The point is inside if the total angle is approximately 2π
  return Math.abs(totalAngle) > Math.PI;
}

export { isPointInQuad };
