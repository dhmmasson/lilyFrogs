const dhmdist = (p1, p2) => dist(p1.x, p1.y, p2.x, p2.y);

function generateDiagram() {
  let diagram = null;
  diagram = relaxDiagram(null, 100);
  diagram = subdivide(diagram);
  return diagram;
}

function drawDiagram() {
  if (Game.board.diagram) {
    // Draw the quads
    stroke(colors["Midnight green"]);
    strokeWeight(1);
    noFill();
    Game.board.diagram.quads.forEach((quad) => {
      drawConnection(quad, 0, color(colors["Celestial Blue"]));
    });
    Game.board.diagram.quads.forEach((quad) => {
      drawQuad(quad, color(colors["Mint"]));
    });
  }
}

function followQuad(quad, direction, color) {
  let nextQuad = quad.neighbours[direction];
  if (!nextQuad || nextQuad.removed || nextQuad.occupied) {
    return false;
  }
  let nextDirection = //find in the nextQuad where we come from
    (nextQuad.neighbours.findIndex((neighbour) => neighbour === quad) + 2) % 4;

  if (nextQuad && !nextQuad.traversed) {
    if (color) drawQuad(nextQuad, color);
    nextQuad.traversed = true;
    followQuad(nextQuad, nextDirection, color);
  }
}

/**
 * @typedef {Object} Quad
 * @property {Voronoi.Cell} cell - The Voronoi cell associated with the quad.
 * @property {[Voronoi.Edge, Voronoi.Edge, Voronoi.Edge, Voronoi.Edge]} edges - The four edges that form the quad.
 * @property {number} id - The unique identifier for the quad.
 * @property {[Quad, Quad, Quad, Quad]} neighbours - The four neighboring quads.
 * @property {Voronoi.Vertex} site - The Voronoi vertex (site) associated with the quad.
 * @property {[Voronoi.Vertex, Voronoi.Vertex, Voronoi.Vertex, Voronoi.Vertex]} vertices - The four vertices of the quad.
 * @property {boolean} removed - Whether the quad has been removed.
 */

/**
 * Check if a point (the mouse) is inside a quad.
 * @param {Voronoi.Vertex} point
 * @param {Quad} quad
 * @returns boolean
 */
function isPointInQuad(point, quad) {
  const vertices = quad.vertices.map((v) => {
    return { x: v.x * Game.board.size.width, y: v.y * Game.board.size.height };
  });
  let totalAngle = 0;

  // Loop through each pair of consecutive vertices (forming vectors to the point)
  for (let i = 0; i < vertices.length; i++) {
    const v1 = createVector(vertices[i].x - point.x, vertices[i].y - point.y);
    const v2 = createVector(
      vertices[(i + 1) % vertices.length].x - point.x,
      vertices[(i + 1) % vertices.length].y - point.y
    );
    const angle = v1.angleBetween(v2);
    totalAngle += angle;
  }

  return Math.abs(totalAngle) > Math.PI;
}

/**
 * Compute and update the centroid of a cell.
 * Return the distance between the centroid and the site (seed of the cell).
 * @param {Voronoi.Cell} cell
 * @returns {number} The distance between the centroid and the site.
 */
function computeCentroid(cell) {
  cell.centroid = { x: 0, y: 0 };
  cell.halfedges.forEach((halfedge) => {
    const v = halfedge.getStartpoint();
    cell.centroid.x += v.x;
    cell.centroid.y += v.y;
  });
  cell.centroid.x /= cell.halfedges.length;
  cell.centroid.y /= cell.halfedges.length;

  return dhmdist(cell.centroid, cell.site);
}

/**
 * Compute all the centroids of the cells in the diagram, and return the total distance between the centroids and the sites of all cells.
 * @returns {number} The total distance between the centroids and the sites of all cells.
 */
function computeCentroids() {
  return Game.board.diagram.cells.reduce(
    (totalDistance, cell) => totalDistance + computeCentroid(cell),
    0
  );
}

/**
 * Subdivide the diagram into quads.
 * @param {Voronoi.Diagram} diagram
 * @returns {Voronoi.Diagram} The diagram with the quads.
 * */
function subdivide(diagram) {
  let quads = [];
  const edges = [];
  const vertices = diagram.vertices.slice() || [];

  // Generate edges from the voronoi edges
  // cut existing edges in half
  // generate edges from the site to the middle of the voronoi edges
  // Store them in the original edges for easy access when subdividing
  for (const edge of diagram.edges) {
    va = edge.va;
    vb = edge.vb;
    let middle = new Voronoi.prototype.Vertex(
      (va.x + vb.x) / 2,
      (va.y + vb.y) / 2
    );
    vertices.push(middle);
    edge.middlePoint = middle;

    // First half of the perimeter
    let edgeFirstHalf = new Voronoi.prototype.Edge(edge.lSite, edge.rSite);
    edgeFirstHalf.va = va;
    edgeFirstHalf.vb = middle;
    edges.push(edgeFirstHalf);
    // Second half of the perimeter
    let edgeSecondHalf = new Voronoi.prototype.Edge(edge.rSite, edge.lSite);
    edgeSecondHalf.va = middle;
    edgeSecondHalf.vb = vb;
    edges.push(edgeSecondHalf);

    edge.daughters = [edgeFirstHalf, edgeSecondHalf];

    // From the center of the cell to the middle of the edge
    let edgeMiddleLeft = new Voronoi.prototype.Edge(edge.lSite, edge.lSite);
    edgeMiddleLeft.va = edge.lSite;
    edgeMiddleLeft.vb = middle;
    edges.push(edgeMiddleLeft);
    edge.middleEdges = [edgeMiddleLeft];

    //if there is a right site
    if (edge.rSite) {
      let edgeMiddleRight = new Voronoi.prototype.Edge(edge.rSite, edge.rSite);
      edgeMiddleRight.va = edge.rSite;
      edgeMiddleRight.vb = middle;
      edges.push(edgeMiddleRight);
      edge.middleEdges.push(edgeMiddleRight);
    }
  }

  // Each edge will reference the two quad on either side
  edges.forEach((edge) => {
    edge.quad = [];
  });

  for (const cell of diagram.cells) {
    vertices.push(cell.site);
    let cellVertices = [];
    let va;
    //split the edges

    let perimterEdges = [];
    let insideEdges = [];

    // Generate the quads

    for (const halfedge of cell.halfedges) {
      va = halfedge.getStartpoint();
      vb = halfedge.getEndpoint();
      middle = halfedge.edge.middlePoint;
      if (halfedge.site === halfedge.edge.lSite) {
        perimterEdges.push(halfedge.edge.daughters[0]);
        perimterEdges.push(halfedge.edge.daughters[1]);
      } else {
        perimterEdges.push(halfedge.edge.daughters[1]);
        perimterEdges.push(halfedge.edge.daughters[0]);
      }

      if (halfedge.edge.lSite === cell.site) {
        insideEdges.push(halfedge.edge.middleEdges[0]);
        insideEdges.push(halfedge.edge.middleEdges[0]);
      } else {
        insideEdges.push(halfedge.edge.middleEdges[1]);
        insideEdges.push(halfedge.edge.middleEdges[1]);
      }

      cellVertices.push(va);
      cellVertices.push(middle);
    }
    // Add the last vertex // same as tht first
    cellVertices.push(cellVertices.shift());
    perimterEdges.push(perimterEdges.shift());
    insideEdges.push(insideEdges.shift());
    // duplicate the first middle
    cellVertices.push(cellVertices[0]);

    while (cellVertices.length > 1) {
      let vertices = [
        cell.site, // center
        cellVertices.shift(), //middle
        cellVertices.shift(), //corner
        cellVertices[0], // next middle (keep for next quad)
      ];
      let quad = {
        site: vertices.reduce(
          (acc, v) => {
            acc.x += v.x / 4;
            acc.y += v.y / 4;
            return acc;
          },
          { x: 0, y: 0 }
        ),
        edges: [
          insideEdges.shift(),
          perimterEdges.shift(),
          perimterEdges.shift(),
          insideEdges.shift(),
        ],
        vertices,
        cell,
      };

      // Register the quad to the edge
      quad.edges.forEach((edge) => {
        edge.quad.push(quad);
      });
      quad.lilyPad = random(Game.assets.lilypads);
      quads.push(quad);
    }
  }

  // Define the neighbour by looking at the edges
  quads.forEach((quad, i) => {
    quad.id = i;
    quad.neighbours = quad.edges.map((edge) => {
      return edge.quad.filter((q) => q !== quad)[0];
    });
  });

  diagram.quads = quads;
  diagram.dhmEdges = edges;
  return diagram;
}

function relaxDiagram(diagram, maxIterations) {
  let temp = 10;
  while (temp > 0.1 && maxIterations-- > 0) {
    voronoi.recycle(Game.board.diagram);
    diagram = Game.board.diagram = voronoi.compute(Game.board.sites, {
      xl: 0,
      xr: 1,
      yt: 0,
      yb: 1,
    });
    temp = computeCentroids();
    Game.board.sites = diagram.cells.map((cell) => {
      return cell.centroid;
    });
  }
  return diagram;
}
