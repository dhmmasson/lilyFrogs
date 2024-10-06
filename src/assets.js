/**
 * Load the assets and set the colors and stuff
 *
 */
function preload() {
  Game.assets = {};
  Game.assets.frog_blue = loadImage("./assets/frog-blue.png");
  Game.assets.frog_pink = loadImage("./assets/frog-pink.png");
  Game.assets.lilypads = Array(2)
    .fill()
    .map((_, i) => {
      return loadImage(`./assets/lilypad${i + 1}.png`);
    });
  Game.assets.lotus = Array(4)
    .fill()
    .map((_, i) => {
      return loadImage(`./assets/lotus${i + 1}.png`);
    });
  Game.assets.frog_halo = loadImage("./assets/frog-halo.png");
  Game.assets.fly = Array(2)
    .fill()
    .map((_, i) => {
      return loadImage(`./assets/fly${i + 1}.png`);
    });
}

colors = {
  "Midnight green": "#005f73",
  "Dark cyan": "#0a9396",
  Mint: "#61bd9e",
  Vanilla: "#e9d8a6",
  Gamboge: "#e99700",
  "Cocoa Brown": "#de7002",
  Tawny: "#cb5f12",
  "Engineering orange": "#b92113",
  "Penn red": "#9d1b12",
  "Falu red": "#7a1815",
  // "Midnight green": "#1d5267",
  "Celestial Blue": "#0f9ad2",
  "Pale azure": "#6cd4ff",
  "Cosmic latte": "#fff9eb",
  "Persian pink": "#fe7fd1",
  "Deep pink": "#ff1499",
  "Magenta dye": "#b80068",
};

colors.main = colors["Midnight green"];
colors.pink = colors["Persian pink"];
colors.blue = colors["Pale azure"];
