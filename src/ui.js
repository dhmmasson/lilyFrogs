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
  gui.setFont("Cabin Sketch");
  // gui.setTitle(menu.title);

  let y = Game.board.size.height / 2 - (menu.buttons.length * 32) / 2;
  menu.buttons.forEach((button) => {
    button.handle = createButton(
      button.label,
      Game.board.size.width / 2 - menu.buttonSize / 2,
      y,
      menu.buttonSize,
      32
    );
    y += 32 + menu.buttonSpacing;
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

  background(colors["Midnight green"]);
  drawGui();

  // Check if buttons are pressed
  checkButtons();

  textAlign(CENTER, TOP);
  fill(colors["Vanilla"]);
  text(
    "Higscore " + Game.highscores.reduce((a, e) => max(a, e), 0),
    Game.board.size.width / 2,
    10
  );
}

function displayScore() {
  textSize(24);
  textAlign(LEFT, TOP);
  fill(colors["Persian pink"]);
  text(Game.players[0].score, 10, 10);
  textAlign(RIGHT, TOP);
  fill(colors["Pale azure"]);
  text(Game.players[1].score, width - 10, 10);

  fill(Game.players[Game.currentPlayer].color);
  textAlign(CENTER, TOP);
  rectMode(RADIUS);
  fill(Game.players[Game.currentPlayer].color);
  rect(width / 2, 20, 150, 20, 5, 5, 5, 5);
  fill(0);
  text("Player " + Game.currentPlayer + " " + Game.action, width / 2, 10);
}
