function Frog(player, quad) {
  this.player = player;
  this.quad = quad;
  this.higlighted = false;
  this.selected = false;
}

function drawFrogs() {
  Game.players.forEach((player) => {
    player.frogs.forEach((frog) => {
      drawFrog(player, frog);
    });
  });
}

function highlightFrog(quad, color) {
  tint(color);
  image(
    Game.assets.frog_halo,
    quad.site.x * Game.board.size.width,
    quad.site.y * Game.board.size.height - 16,
    34 + 4 * sin(frameCount * 0.1),
    34 + 4 * sin(frameCount * 0.1)
  );
  noTint();
}

function drawFrog(player, frog) {
  let quad = frog.quad;
  if (player == Game.players[Game.currentPlayer]) {
    highlightFrog(quad, colors["Vanilla"]);
  }
  if (frog.higlighted) {
    highlightFrog(quad, colors["Gamboge"]);
    frog.higlighted = false;
  }
  if (frog.selected) {
    highlightFrog(quad, player.color);
  }
  image(
    player.frog,
    quad.site.x * Game.board.size.width,
    quad.site.y * Game.board.size.height - 16,
    32,
    32
  );
}
