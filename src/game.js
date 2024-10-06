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
  players: [],
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
      frogs: [],
      score: 0,
    },
    {
      color: colors["Pale azure"],
      frog: Game.assets.frog_blue,
      frogs: [],
      score: 0,
    },
  ];
  Game.players.forEach((player) => {
    player.frogs = Array(3)
      .fill(0)
      .map((e, index) => {
        // Get a random not remove quad, not occupied by a frog
        quad = random(
          diagram.quads.filter((quad) => !quad.removed && !quad.occupied)
        );
        quad.occupied = true;
        return new Frog(player, quad);
      });
  });
  diagram.quads
    .filter((quad) => !quad.removed && !quad.occupied)
    .forEach((quad) => {
      quad.points = random([1, 1, 1, 1, 1, 2, 2, 2, 3, 5]);
    });
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
      frog = getFrog();
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
}

function drawGame() {
  if (Game.state !== GameStates.playing) {
    return false;
  }
  drawDiagram();
  drawFrogs();

  // untraverse the quads
  // Draw the score for each player in their colors at the top of the screen
  // and a panel fo the current playing player
  // Score:Text CurrentPlayer:rect with colorful background Score:Text

  textSize(16);
  textAlign(LEFT, TOP);
  fill(colors["Persian pink"]);
  text(Game.players[0].score, 10, 10);
  textAlign(RIGHT, TOP);
  fill(colors["Pale azure"]);
  text(Game.players[1].score, width - 10, 10);

  fill(Game.players[Game.currentPlayer].color);
  textAlign(CENTER, TOP);
  rectMode(RADIUS);
  rect(Game.width / 2, 20, 100, 10);
  fill(0);
  text("Player " + Game.currentPlayer, Game.width / 2, 10);
}

function setup() {
  // Create canvas and put it in the canvas div to guess the size
  imageMode(CENTER);
  createCanvas(Game.board.size.width, Game.board.size.height).parent("#canvas");
  windowResized();
  //startGame();
}

function mouseClicked() {
  if (Game.state !== GameStates.playing) return;
  const diagram = Game.board.diagram;
  if (getAudioContext().state !== "running") {
    console.log("Starting Audio");
    userStartAudio();
    Game.music.play();
  }
  let frog = getFrog();
  let quad = getQuad();
  if (frog && !frog.selected) {
    random(Game.whao).play();
    if (Game.currentFrog) Game.currentFrog.selected = false;
    Game.currentFrog = frog;
    frog.selected = true;
    //Valid moves
    let quads = getValidMoves(frog);
    diagram.quads.forEach((quad) => {
      quad.valid = false;
    });
    quads.forEach((quad) => {
      quad.valid = true;
    });
  } else if (frog && frog.selected) {
    frog.selected = false;
    Game.currentFrog = null;
    diagram.quads.forEach((quad) => {
      quad.valid = false;
    });
  } else {
    if (Game.currentFrog) {
      let quads = getValidMoves(Game.currentFrog);
      if (quads.includes(quad)) {
        random(Game.whao).play();
        frog = Game.currentFrog;
        // Remove the quad under the frog
        frog.quad.removed = true;
        player = Game.players[Game.currentPlayer];
        player.score += frog.quad.points || 0;
        // Move the Frog to the quad
        frog.quad = quad;
        Game.currentFrog = null;
        frog.selected = false;
        // Change the player
        Game.currentPlayer = (Game.currentPlayer + 1) % Game.players.length;
        diagram.quads.forEach((quad) => {
          quad.valid = false;
        });
      }
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

function getValidMoves(frog) {
  let diagram = Game.board.diagram;
  cleanBoard();
  let validMoves = [];
  followQuad(frog.quad, 0);
  followQuad(frog.quad, 2);
  diagram.quads.forEach((quad) => {
    if (quad.traversed) {
      validMoves.push(quad);
    }
  });
  cleanBoard();
  followQuad(frog.quad, 1);
  followQuad(frog.quad, 3);
  diagram.quads.forEach((quad) => {
    if (quad.traversed) {
      validMoves.push(quad);
    }
  });
  cleanBoard();
  return validMoves;
}

function isValidMove(frog, quad) {
  let diagram = Game.board.diagram;
  diagram.quads.forEach((quad) => {
    quad.visited = false;
  });
  // Check one direction
  let valid = false;
  followQuad(frog.quad, 0);
  followQuad(frog.quad, 2);
  valid = quad.visited;
  // Because both direction can intersect on that board.
  diagram.quads.forEach((quad) => {
    quad.valid = true;
    quad.visited = false;
  });
  followQuad(frog.quad, 1);
  followQuad(frog.quad, 3);
  valid = valid || quad.visited;
  diagram.quads.forEach((quad) => {
    quad.valid = true;
    quad.visited = false;
  });
  return valid;
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
  if (!quad.valid) tint(color);
  image(
    quad.lilyPad,
    quad.site.x * Game.board.size.width,
    quad.site.y * Game.board.size.height,
    radius * Game.board.size.width,
    radius * Game.board.size.height
  );
  noTint();
  if (quad.points == 5) {
    // Draw a lotus
    image(
      Game.assets.lotus[0],
      quad.site.x * Game.board.size.width,
      quad.site.y * Game.board.size.height,
      32,
      32
    );
  }
  // Draw the points for 1, 2, 3 point draw a fly
  if (quad.points < 5) {
    var x = quad.site.x * Game.board.size.width;
    var y = quad.site.y * Game.board.size.height;
    Array(quad.points)
      .fill(0)
      .forEach((e, index) => {
        image(
          Game.assets.fly[0],
          x +
            (noise(0, quad.id + index + frameCount / 100) - 0.5) *
              radius *
              Game.board.size.width,
          y +
            (noise(1, quad.id + index + frameCount / 100) - 0.5) *
              radius *
              Game.board.size.width,
          24,
          24
        );
      });
  }
}
