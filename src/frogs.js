function Frog(player, quad) {
  this.player = player;
  this.quad = quad;
  this.higlighted = false;
  this.selected = false;
}

function drawFrogs() {
  Game.players.forEach((player) => {
    player.frogs.forEach((frog, index) => {
      drawFrog(player, frog, index);
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

function drawFrog(player, frog, index) {
  if (!frog.quad) {
    // Draw the frog on the player's side (0 left, 1 right)
    let x = player.side ? Game.board.size.width - 20 : 20;
    let y = index * 40 + 20 + 32;
    image(player.frog, x, y, 32, 32);
    return;
  }
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
