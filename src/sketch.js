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

  background(220);
  drawGui();

  // Check if buttons are pressed
  checkButtons();
}

dhmdist = (p1, p2) => dist(p1.x, p1.y, p2.x, p2.y);

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
      perimterEdges.push(halfedge.edge.daughters[0]);
      perimterEdges.push(halfedge.edge.daughters[1]);

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
    stroke(0);
    strokeWeight(1);
    Game.board.diagram.cells.forEach((cell) => {
      fill(200);
      beginShape();
      cell.halfedges.forEach((halfedge) => {
        const v = halfedge.getStartpoint();
        vertex(v.x * Game.board.size.width, v.y * Game.board.size.height);
      });
      endShape(CLOSE);
    });

    // Draw the quads
    stroke(255, 0, 0);
    strokeWeight(1);
    noFill();

    Game.board.diagram.quads.forEach((quad) => {
      beginShape();
      quad.vertices.forEach((v) => {
        vertex(v.x * Game.board.size.width, v.y * Game.board.size.height);
      });
      endShape(CLOSE);
    });

    // Draw the edges
    Game.board.diagram.dhmEdges.forEach((edge) => {
      line(
        edge.va.x * Game.board.size.width,
        edge.va.y * Game.board.size.height,
        edge.vb.x * Game.board.size.width,
        edge.vb.y * Game.board.size.height
      );
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
  background(100);
  displayMenu();
  drawGame();
}
