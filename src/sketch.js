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

/** */
function startGame() {
  Game.state = GameStates.playing;
}

function setup() {
  // Create canvas and put it in the canvas div to guess the size
  createCanvas(Game.board.size.width, Game.board.size.height).parent("#canvas");
  windowResized();
}

function draw() {
  background(10);
  displayMenu();
}
