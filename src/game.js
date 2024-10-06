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
  buttons: [
    { label: "Start 1 Player Game", action: () => startGame(1), handle: null },
    { label: "Start 2 Players Game", action: () => startGame(2), handle: null },
  ],
  title: "Main Menu",
  buttonSize: 200,
  buttonSpacing: 10,
};

const Actions = {
  place: "Place next frog",
  select: "Select a frog",
  move: "Pick a destination",
  wait: "Loading",
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
  action: Actions.wait,
  highscores: [],
};

function aiThink() {
  if (Game.currentPlayer == 1) {
    if (Game.action == Actions.place) {
      let quad = random(
        Game.board.diagram.quads.filter(
          (quad) => !quad.removed && !quad.occupied && quad.points == 1
        )
      );
      let frog = Game.players[Game.currentPlayer].frogs.find(
        (frog) => !frog.quad
      );
      frog.quad = quad;
      quad.occupied = true;
      checkPlacementDone();
      Game.currentPlayer = 0;
      highlightValidPlacement();
      return true;
    }
    if (Game.action == Actions.select) {
      let frog = random(
        Game.players[Game.currentPlayer].frogs
          //.filter((frog) => !frog.selected)
          .filter((frog) => getValidMoves(frog).length > 0) // Only select frogs that can move
      );
      frog.selected = true;
      Game.whao[0].play();
      Game.currentFrog = frog;
      Game.action = Actions.move;
      return true;
    }
    if (Game.action == Actions.move) {
      let frog = Game.currentFrog;
      let quads = getValidMoves(frog);
      if (quads.length == 0) {
        Game.players[Game.currentPlayer].done = true;
        frog.selected = false;
        Game.currentFrog = null;
        Game.action = Actions.select;
        return false;
      }
      let quad = random(quads);
      quad =
        quads.reduce((acc, quad) => {
          if (quad.points > acc.points) {
            return quad;
          }
          return acc;
        }) || quad;
      frog.quad.occupied = false;
      frog.quad.removed = true;
      Game.whao[0].play();
      frog.quad = quad;
      Game.players[Game.currentPlayer].score += quad.points || 0;
      Game.action = Actions.select;
      quad.occupied = true;
      Game.currentPlayer = 0;
      return true;
    }
  }
  return false;
}

/** */
function startGame(numberOfPlayers) {
  console.log("Start Game");
  if (numberOfPlayers == 1) {
    Game.ai = true;
    Game.aiHandle = setInterval(aiThink, 1000);
  } else {
    Game.ai = false;
    clearInterval(Game.aiHandle);
  }
  Game.music.play();

  Game.board.sites = Array(20)
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
  count = diagram.quads.filter((quad) => !quad.removed).length;
  while (count > 56) {
    quad = random(diagram.quads.filter((quad) => !quad.removed));
    quad.removed = true;
    count = diagram.quads.filter((quad) => !quad.removed).length;
  }

  console.log(diagram);
  Game.state = GameStates.playing;
  Game.currentPlayer = 0;
  setTimeout(() => {
    Game.action = Actions.place;
    unvalidBoard();
    highlightValidPlacement();
  }, 300);
  Game.players = [
    {
      color: colors["Persian pink"],
      frog: Game.assets.frog_pink,
      frogs: [],
      score: 0,
      side: 0,
    },
    {
      color: colors["Pale azure"],
      frog: Game.assets.frog_blue,
      frogs: [],
      score: 0,
      side: 1,
    },
  ];

  values = [
    ...Array(6).fill(5),
    ...Array(30).fill(1),
    ...Array(10).fill(2),
    ...Array(10).fill(3),
  ];

  Game.players.forEach((player) => {
    player.frogs = Array(3)
      .fill(0)
      .map((e, index) => {
        return new Frog(player, null);
      });
  });
  diagram.quads
    .filter((quad) => !quad.removed && !quad.occupied)
    .forEach((quad) => {
      quad.points = random(values);
      values.splice(values.indexOf(quad.points), 1);
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

  displayScore();
  if (Game.action != Actions.place && Game.action != Actions.wait) {
    Game.players.forEach((player) => {
      player.done = isPlayerDone(player);
    });
    // If both players are done, end the game
    if (Game.players.reduce((acc, player) => acc && player.done, true)) {
      clearInterval(Game.aiHandle);
      Game.highscores.push(Game.players[0].score);
      Game.state = GameStates.menu;
      Game.nextMenu = "main";
      Game.action = Actions.wait;
    }
    if (Game.players[Game.currentPlayer].done) {
      Game.currentPlayer = (Game.currentPlayer + 1) % Game.players.length;
    }
  }
}

function setup() {
  // Create canvas and put it in the canvas div to guess the size
  textFont("Cabin Sketch");
  imageMode(CENTER);
  createCanvas(Game.board.size.width, Game.board.size.height).parent("#canvas");
  windowResized();

  //startGame();
}

function highlightValidPlacement() {
  unvalidBoard();
  Game.board.diagram.quads
    .filter((quad) => !quad.removed && !quad.occupied && quad.points == 1)
    .forEach((quad) => {
      quad.valid = true;
    });
}

function PlaceFrog() {
  unvalidBoard();
  highlightValidPlacement();

  let quad = getQuad();
  if (quad && quad.valid) {
    random(Game.whao).play();
    let player = Game.players[Game.currentPlayer];
    let frog = player.frogs.find((frog) => !frog.quad);
    frog.quad = quad;
    quad.occupied = true;
    Game.currentPlayer = (Game.currentPlayer + 1) % Game.players.length;
    checkPlacementDone();
  }
}

function checkPlacementDone() {
  let remainingFrogs = Game.players.reduce((acc, player) => {
    return (
      acc +
      player.frogs.reduce((acc, frog) => {
        return acc + (frog.quad ? 0 : 1);
      }, 0)
    );
  }, 0);
  console.log(remainingFrogs);
  if (remainingFrogs == 0) {
    Game.action = Actions.select;
    unvalidBoard();
  }
}

function PlayingFrog() {
  const diagram = Game.board.diagram;
  if (getAudioContext().state !== "running") {
    console.log("Starting Audio");
    userStartAudio();
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
    unvalidBoard();
    quads.forEach((quad) => {
      quad.valid = true;
    });
    Game.action = Actions.move;
  } else if (frog && frog.selected) {
    frog.selected = false;
    Game.currentFrog = null;
    unvalidBoard();
    Game.action = Actions.select;
  } else {
    if (Game.currentFrog) {
      let quads = getValidMoves(Game.currentFrog);
      if (quads.includes(quad)) {
        random(Game.whao).play();
        frog = Game.currentFrog;
        // Remove the quad under the frog
        frog.quad.removed = true;
        player = Game.players[Game.currentPlayer];

        // Move the Frog to the quad
        frog.quad = quad;
        quad.occupied = true;
        player.score += frog.quad.points || 0;

        Game.currentFrog = null;
        frog.selected = false;
        // Change the player
        Game.currentPlayer = (Game.currentPlayer + 1) % Game.players.length;
        Game.action = Actions.select;
        unvalidBoard();
      }
    }
  }
}

function mousePressed() {
  if (Game.state !== GameStates.playing) return;
  if (Game.action == Actions.place) {
    PlaceFrog();
  }
  if (Game.action !== Actions.place) {
    PlayingFrog();
  }
}

function unvalidBoard() {
  Game.board.diagram.quads.forEach((quad) => {
    quad.valid = false;
  });
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

function isPlayerDone(player) {
  return !player.frogs.reduce((acc, frog) => {
    return acc || getValidMoves(frog).length > 0;
  }, false);
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

  if (quad.valid) {
    fill(Game.players[Game.currentPlayer].color);
    ellipse(
      quad.site.x * Game.board.size.width,
      quad.site.y * Game.board.size.height,
      radius * Game.board.size.width,
      radius * Game.board.size.height
    );
  }
  if (!quad.valid) tint(color);
  image(
    quad.lilyPad,
    quad.site.x * Game.board.size.width,
    quad.site.y * Game.board.size.height,
    radius * Game.board.size.width,
    radius * Game.board.size.height
  );
  noTint();
  if (!quad.occupied) {
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
}
