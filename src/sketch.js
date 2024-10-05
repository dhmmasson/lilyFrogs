/** Levels */
const Levels = {
  tutorial: {
    level: 0,
    title: "Tutorial",
    board: {
      sites: [],
    },
  },
};

const GameStates = {
  menu: "menu",
  playing: "playing",
};

const Game = {
  level: Levels.tutorial,
  state: "menu",
  currentLevel: 0,
};

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
}
