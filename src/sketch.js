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
  let temp = 10;
  let maxIterations = 100;
  let diagram = null;
  // Relax the diagram
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
  Game.board.sites = Array(10)
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
      // Draw centroid
      fill(0);
      ellipse(
        cell.centroid.x * Game.board.size.width,
        cell.centroid.y * Game.board.size.height,
        5
      );
    });
  }
}

function drawGame() {
  if (Game.state !== GameStates.playing) {
    return false;
  }
  drawDiagram();
  fill(25);
  Game.board.sites.forEach((site) => {
    ellipse(
      site.x * Game.board.size.width,
      site.y * Game.board.size.height,
      10
    );
  });
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
