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

/** */
function startGame() {
  console.log("Start Game");
  Game.board.sites = Array(14)
    .fill({ x: 0, y: 0 })
    .map((site, index) => {
      return {
        x: constrain((noise(0, index) - 0.5) * 2 + 0.5, 0.001, 0.999),
        y: constrain((noise(1, index) - 0.5) * 2 + 0.5, 0.001, 0.999),
      };
    });

  let diagram = generateDiagram();
  diagram.quads
    .filter((e) => e.neighbours.filter((e) => e).length !== 4)
    .forEach((e) => {
      e.removed = true;
    });
  console.log(diagram);
  Game.state = GameStates.playing;
  Game.currentPlayer = 0;
  Game.players = [
    {
      color: colors["Persian pink"],
      frog: Game.assets.frog_pink,
      frogs: [
        {
          quad: diagram.quads[10],
          direction: 0,
        },
      ],
    },
    {
      color: colors["Pale azure"],
      frog: Game.assets.frog_blue,
      frogs: [
        {
          quad: diagram.quads[20],
          direction: 2,
        },
      ],
    },
  ];
}

function draw() {
  background(colors["Midnight green"]);
  displayMenu();
  // Draw the mouse
  // find the quad
  if (Game.board.diagram) {
    let quad = Game.board.diagram.quads.find((quad) => {
      return isPointInQuad({ x: mouseX, y: mouseY }, quad);
    });
    if (quad) {
      drawQuad(quad, color(colors["Cosmic latte"]));
      quad.traversed = true;
      followQuad(quad, 0, color(colors["Persian pink"]));
      followQuad(quad, 2, color(colors["Persian pink"]));
      cleanBoard();
      followQuad(quad, 1, color(colors["Pale azure"]));
      followQuad(quad, 3, color(colors["Pale azure"]));
      cleanBoard();
      //Find the frog
      let [frog] = Game.players[Game.currentPlayer].frogs.filter(
        (frog) => frog.quad === quad
      );
      if (frog) {
        frog.higlighted = true;
      }
      if (mouseIsPressed) {
      }
    }
    drawGame();
    // Draw Mouse
    fill(0);
    ellipse(mouseX, mouseY, 5, 5);
  }

  // untraverse the quads
}

function drawGame() {
  if (Game.state !== GameStates.playing) {
    return false;
  }
  drawDiagram();
  drawFrogs();
}

function setup() {
  // Create canvas and put it in the canvas div to guess the size
  imageMode(CENTER);
  createCanvas(Game.board.size.width, Game.board.size.height).parent("#canvas");
  windowResized();
  //startGame();
}

function mouseClicked() {
  let frog = getFrog();
  let quad = getQuad();
  if (frog && !frog.selected) {
    if (Game.currentFrog) Game.currentFrog.selected = false;
    Game.currentFrog = frog;
    frog.selected = true;
  } else if (frog && frog.selected) {
    frog.selected = false;
    Game.currentFrog = null;
  } else {
    if (Game.currentFrog) {
      frog = Game.currentFrog;
      // Remove the quad under the frog
      frog.quad.removed = true;
      // Move the Frog to the quad
      frog.quad = quad;
      Game.currentFrog = null;
      frog.selected = false;
      // Change the player
      Game.currentPlayer = (Game.currentPlayer + 1) % Game.players.length;
    }
  }
}

function getQuad() {
  return (quad = Game.board.diagram.quads.find((quad) => {
    return isPointInQuad({ x: mouseX, y: mouseY }, quad);
  }));
}

function getFrog() {
  let quad = getQuad();
  if (quad) {
    return Game.players[Game.currentPlayer].frogs.find((frog) => {
      return frog.quad === quad;
    });
  } else {
    return null;
  }
}

function cleanBoard() {
  Game.board.diagram.quads.forEach((quad) => {
    quad.traversed = false;
  });
}
function drawConnection(quad, direction, color) {
  if (quad.removed) {
    return false;
  }
  fill("#61bd9e");
  strokeWeight(2);
  stroke(color);
  quad.neighbours.forEach((neighbour) => {
    if (neighbour && !neighbour.removed) {
      stroke("#61bd9e");
      strokeWeight(2);
      line(
        quad.site.x * Game.board.size.width,
        quad.site.y * Game.board.size.height,
        neighbour.site.x * Game.board.size.width,
        neighbour.site.y * Game.board.size.height
      );
    }
  });
}
function drawQuad(quad, color) {
  if (quad.removed) {
    return false;
  }
  // Slight highlight of the cell to help select
  stroke(0, 0, 0, 5);
  strokeWeight(1);
  noFill();
  beginShape();
  quad.vertices.forEach((v) => {
    vertex(v.x * Game.board.size.width, v.y * Game.board.size.height);
  });
  endShape(CLOSE);
  let radius =
    quad.neighbours.reduce((acc, neighbour) => {
      return min(acc, dhmdist(neighbour.site, quad.site));
    }, 1000) * 0.89;
  tint(color);
  image(
    quad.lilyPad,
    quad.site.x * Game.board.size.width,
    quad.site.y * Game.board.size.height,
    radius * Game.board.size.width,
    radius * Game.board.size.height
  );
  noTint();
}
