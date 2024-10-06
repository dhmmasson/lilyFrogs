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

function drawFrog(player, frog) {
  let quad = frog.quad;
  if (frog.higlighted || frog.selected) {
    frog.higlighted = false;
    tint(player.color);
    image(
      Game.assets.frog_halo,
      quad.site.x * Game.board.size.width,
      quad.site.y * Game.board.size.height - 16,
      36,
      36
    );
    noTint();
  }
  image(
    player.frog,
    quad.site.x * Game.board.size.width,
    quad.site.y * Game.board.size.height - 16,
    32,
    32
  );
}
