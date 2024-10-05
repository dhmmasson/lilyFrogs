colors = {
  "Midnight green": "#005f73",
  "Dark cyan": "#0a9396",
  Mint: "#61bd9e",
  Vanilla: "#e9d8a6",
  Gamboge: "#e99700",
  "Cocoa Brown": "#de7002",
  Tawny: "#cb5f12",
  "Engineering orange": "#b92113",
  "Penn red": "#9d1b12",
  "Falu red": "#7a1815",
};

/** Levels */
const voronoi = new Voronoi();
const Levels = {
  tutorial: {
    level: 0,
    title: "Tutorial",
    board: {
      sites: [],
    },
  },
};

/** MENUS */
const mainMenuStruct = {
  buttons: [{ label: "Start Game", action: startGame, handle: null }],
  title: "Main Menu",
  buttonSize: 200,
  buttonSpacing: 10,
};

const GameStates = {
  menu: "menu",
  playing: "playing",
};

const Game = {
  level: Levels.tutorial,
  state: "menu",
  currentLevel: 0,
  board: {
    size: {
      width: 100,
      height: 100,
    },
    sites: [], // Voronoi
    diagram: null,
  },
  menus: {
    main: mainMenuStruct,
  },
  currentMenu: "",
  nextMenu: "main",
};

/** UI */
//Resize canvas to fill the div
function windowResized() {
  const size = select("#canvas").size();
  // Square Board
  let minSize = min(size.width, size.height);
  Game.board.size.width = minSize;
  Game.board.size.height = minSize;
  resizeCanvas(minSize, minSize);
  // Force Menu refresh
  Game.currentMenu = "";
}

function touchMoved() {
  // do some stuff
  return false;
}

function initMenu(menu) {
  // Display the main menu
  gui = createGui();
  // gui.setTitle(menu.title);
  let y = 50;
  menu.buttons.forEach((button) => {
    button.handle = createButton(
      button.label,
      Game.board.size.width / 2 - menu.buttonSize / 2,
      y,
      menu.buttonSize
    );
    y += menu.buttonSize + menu.buttonSpacing;
  });
  return gui;
}

function checkButtons() {
  Game.menus[Game.currentMenu].buttons.forEach((button) => {
    if (button.handle.isPressed) {
      button.action();
    }
  });
}

function displayMenu() {
  //Only display the menu if the game is in the menu state
  if (Game.state !== GameStates.menu) {
    return false;
  }
  // Create the menu on menu change
  if (Game.currentMenu !== Game.nextMenu) {
    initMenu(Game.menus[Game.nextMenu]);
    Game.currentMenu = Game.nextMenu;
  }

  background(colors["Dark cyan"]);
  drawGui();

  // Check if buttons are pressed
  checkButtons();
}

const dhmdist = (p1, p2) => dist(p1.x, p1.y, p2.x, p2.y);

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

  // The point is inside if the total angle is approximately 2π
  return Math.abs(totalAngle) > Math.PI;
}

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
function computeCentroids() {
  return Game.board.diagram.cells.reduce(
    (totalDistance, cell) => totalDistance + computeCentroid(cell),
    0
  );
}
function generateDiagram() {
  let diagram = null;
  diagram = relaxDiagram(null, 100);
  diagram = subdivide(diagram);
  return diagram;
}

function subdivide(diagram) {
  let quads = [];
  const edges = [];
  const vertices = diagram.vertices.slice() || [];

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
  edges.forEach((edge) => {
    edge.quad = [];
  });

  for (const cell of diagram.cells) {
    vertices.push(cell.site);
    let cellVertices = [];
    let cellEdges = [];
    let va, vb;
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
  console.log(vertices);
  return diagram;
}

function relaxDiagram(diagram, maxIterations) {
  let temp = 10;
  while (temp > 0.01 && maxIterations-- > 0) {
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

/** */
function startGame() {
  console.log("Start Game");
  Game.board.sites = Array(50)
    .fill({ x: 0, y: 0 })
    .map((site, index) => {
      return {
        x: constrain((noise(0, index) - 0.5) * 2 + 0.5, 0.1, 0.9),
        y: constrain((noise(1, index) - 0.5) * 2 + 0.5, 0.1, 0.9),
      };
    });

  let diagram = generateDiagram();
  console.log(diagram);
  Game.state = GameStates.playing;
}

function drawDiagram() {
  if (Game.board.diagram) {
    // Draw the quads
    stroke(colors["Midnight green"]);
    strokeWeight(1);
    noFill();
    Game.board.diagram.quads.forEach((quad) => {
      beginShape();
      quad.vertices.forEach((v) => {
        vertex(v.x * Game.board.size.width, v.y * Game.board.size.height);
      });
      endShape(CLOSE);
    });
  }
}

function drawGame() {
  if (Game.state !== GameStates.playing) {
    return false;
  }
  drawDiagram();
}

function setup() {
  // Create canvas and put it in the canvas div to guess the size
  createCanvas(Game.board.size.width, Game.board.size.height).parent("#canvas");
  windowResized();

  startGame();
}

function draw() {
  background(colors["Dark cyan"]);
  displayMenu();
  drawGame();

  // Draw the mouse
  fill(0);
  ellipse(mouseX, mouseY, 5, 5);
  // find the quad
  if (Game.board.diagram) {
    let quad = Game.board.diagram.quads.find((quad) => {
      return isPointInQuad({ x: mouseX, y: mouseY }, quad);
    });
    if (quad) {
      drawQuad(quad, color(colors.Vanilla));
      quad.traversed = true;
      followQuad(quad, 0, color(colors.Gamboge));
      followQuad(quad, 2, color(colors.Gamboge));

      followQuad(quad, 1, color(colors.Mint));
      followQuad(quad, 3, color(colors.Mint));
    }

    // Draw the connected quads
  }

  // draw the voronoi
  stroke(colors["Midnight green"]);
  strokeWeight(2);
  noFill();
  Game.board.diagram.cells.forEach((cell) => {
    beginShape();
    cell.halfedges.forEach((halfedge) => {
      let v = halfedge.getStartpoint();
      vertex(v.x * Game.board.size.width, v.y * Game.board.size.height);
    });
    endShape(CLOSE);
  });

  // untraverse the quads
  Game.board.diagram.quads.forEach((quad) => {
    quad.traversed = false;
  });
}

function drawQuad(quad, color) {
  stroke(0);
  strokeWeight(1);
  fill(color);
  beginShape();
  quad.vertices.forEach((v) => {
    vertex(v.x * Game.board.size.width, v.y * Game.board.size.height);
  });
  endShape(CLOSE);
}

function followQuad(quad, direction, color) {
  let nextQuad = quad.neighbours[direction];
  if (!nextQuad) {
    return false;
  }
  let nextDirection = //find in the nextQuad where we come from
    (nextQuad.neighbours.findIndex((neighbour) => neighbour === quad) + 2) % 4;

  if (nextQuad && !nextQuad.traversed) {
    drawQuad(nextQuad, color);
    nextQuad.traversed = true;
    followQuad(nextQuad, nextDirection, color);
  }
}
