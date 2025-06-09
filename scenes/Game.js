// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

export default class Game extends Phaser.Scene {
  constructor() {
    super("game");
  }

  init() {
    this.score = 0;
  }

  preload() {
    this.load.tilemapTiledJSON("sin nombre", "public/assets/tilemap/sin nombre.json");
    this.load.image("tileset", "public/assets/texture2.png");
    this.load.image("star", "public/assets/star.png");
    this.load.image("meta", "public/assets/meta.png");

    this.load.spritesheet("dude3", "./public/assets/dude3.png", {
      frameWidth: 39,
      frameHeight: 39,
    });
  }

  create() {
    const map = this.make.tilemap({ key: "sin nombre" });

    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    const tileset = map.addTilesetImage("tileset", "tileset");

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const belowLayer = map.createLayer("Fondo", tileset, 0, 0);
    const platformLayer = map.createLayer("Plataformas", tileset, 0, 0);
    const objectsLayer = map.getObjectLayer("Objetos");

    // Find in the Object Layer, the name "dude" and get position
    const spawnPoint = map.findObject(
      "Objetos",
      (obj) => obj.name === "player"
    );
    console.log("spawnPoint", spawnPoint);

    this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "dude3");

    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this.anims.create({
      key: "down",
      frames: this.anims.generateFrameNumbers("dude3", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude3", { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude3", { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "up",
      frames: this.anims.generateFrameNumbers("dude3", { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "turn",
      frames: [{ key: "dude3", frame: 0 }],
      frameRate: 20,
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    platformLayer.setCollisionByProperty({ esColisionable: true });
    this.physics.add.collider(this.player, platformLayer);

    

    // tiles marked as colliding
    /*
    const debugGraphics = this.add.graphics().setAlpha(0.75);
    platformLayer.renderDebug(debugGraphics, {
      tileColor: null, // Color of non-colliding tiles
      collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
      faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
    });
    */

    // Create empty group of starts
    this.stars = this.physics.add.group();

    // find object layer
    // if type is "star", add to stars group
    objectsLayer.objects.forEach((objData) => {
      console.log(objData);
      const { x = 0, y = 0, name, type } = objData;
      switch (type) {
        case "star": {
          // add star to scene
          // console.log("estrella agregada: ", x, y);
          const star = this.stars.create(x, y, "star");
          star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
          break;
        }
      }
    });

     this.meta = this.physics.add.staticGroup();

    // find object layer
    // if type is "stars", add to stars group
    objectsLayer.objects.forEach((objData) => {
      const { x = 0, y = 0, type } = objData;
      if (type === "meta") {
        this.meta.create(x, y, "meta");
      }
    });

    // add collision between player and stars
    this.physics.add.collider(
      this.player,
      this.stars,
      this.collectStar,
      null,
      this
    );
    // add overlap between stars and platform layer
    this.physics.add.collider(this.stars, platformLayer);

    this.scoreText = this.add.text(2, 0, `Score: ${this.score}`, {
      fontSize: "15px",
      fontFamily: "Arial",
      fontStyle: "bold",
      fill: "#ffff00",      // Amarillo
      stroke: "#000000",    // Borde negro
      strokeThickness: 2,   // Grosor del borde (ajusta el número a tu gusto)
    });

    this.scoreIcons = this.add.group();
    this.maxStars = this.stars.countActive(true); // Número total de estrellas en el nivel

    for (let i = 0; i < this.maxStars; i++) {
      const icon = this.add.image(400 + i * 32, 10, "star").setScale(0.5);
      this.scoreIcons.add(icon);
    }

    this.physics.add.overlap(
      this.player,
      this.meta,
      this.reachMeta,
      null,
      this
    );
  }

  update() {
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.setVelocityY(0);
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      this.player.setVelocityY(0);
      this.player.anims.play("right", true);
    } else if (this.cursors.up.isDown) {
      this.player.setVelocityY(-160);
      this.player.setVelocityX(0);
      this.player.anims.play("up", true);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(160);
      this.player.setVelocityX(0);
      this.player.anims.play("down", true);
    } else {
      this.player.setVelocityX(0);
      this.player.setVelocityY(0);
      this.player.anims.play("turn");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.scene.restart();
    }
  }

  collectStar(player, star) {
    star.disableBody(true, true);

    this.score += 1;
    this.scoreText.setText(`Score: ${this.score}`);

    // Muestra las estrellas recogidas en blanco, las no recogidas en gris
    this.scoreIcons.getChildren().forEach((icon, idx) => {
      if (idx < this.score) {
        icon.setTint(0xffffff); // Blanco para recogidas
      } else {
        icon.setTint(0x888888); // Gris para no recogidas
      }
    });

    // Cambia de escena cuando el score llegue a 5
    // if (this.score >= 5) {
    //   this.scene.start("game2");
    // }
  }

  reachMeta(player, meta) {
    if (this.score >= 5) {
      this.registry.set('score', this.score); // Guarda el score globalmente
      this.scene.start("game2");
    } else {
      console.log("No has alcanzado la puntuación necesaria para avanzar.");
    }
    // Si quieres que la meta desaparezca al tocarla, puedes agregar:
    // meta.disableBody(true, true);
  }
}
