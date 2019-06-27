import Player from "./player.js";
import TILES from "./tile-mapping.js";
import TilemapVisibility from "./tilemap-visibility.js";
import King from "./rey.js";

/**
 * Scene that generates a new dungeon
 */
export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super({key: "DungeonScene"});
    this.level = 0;
    this.life = 100;
    this.weapon = "";
  }
  
  preload() {
    this.load.image("tiles", "assets/tilesets/buch-tileset-48px-extruded.png");
    this.load.spritesheet(
      "characters",
      "assets/spritesheets/buch-characters-64px-extruded.png",
      {
        frameWidth: 64,
        frameHeight: 64,
        margin: 1,
        spacing: 2
      }
    );
    this.load.spritesheet(
      "antifairy",
      "assets/spritesheets/antifairy2.png",
      {
        frameWidth: 21,
        frameHeight : 21

      }
    );
    this.load.spritesheet(
      "insecto",
      "assets/spritesheets/insecto.png",
      {
        frameWidth: 65,
        frameHeight : 64

      }
    );    

    /*this.load.spritesheet(
      "bladetrap",
      "assets/spritesheets/bladeTrap.png",
      {
        frameWidth: 21,
        frameHeight : 22

      }
    );*/
    this.load.image("bladetrap","assets/spritesheets/bladeTrap.png");

    this.load.audio('dust', [
        'assets/audio/Dust [Hotline Miami 2 OST]-M.O.O.N..mp3'
    ]);

    this.load.audio('mpa', [
        'assets/audio/Musikk per automatikk (Hotline Miami OST)-Elliot Berlin.mp3'
    ]);
  }

  create() {
    this.level++;
    this.hasPlayerReachedStairs = false;

    // Generate a random world with a few extra options:
    //  - Rooms should only have odd number dimensions so that they have a center tile.
    //  - Doors should be at least 2 tiles away from corners, so that we can place a corner tile on
    //    either side of the door location
    this.dungeon = new Dungeon({
      width: 50,
      height: 50,
      doorPadding: 2,
      rooms: {
        width: { min: 7, max: 15, onlyOdd: true },
        height: { min: 7, max: 15, onlyOdd: true }
      }
    });

    this.dungeon.drawToConsole();

    // Creating a blank tilemap with dimensions matching the dungeon
    const map = this.make.tilemap({
      tileWidth: 48,
      tileHeight: 48,
      width: this.dungeon.width,
      height: this.dungeon.height
    });
    const tileset = map.addTilesetImage("tiles", null, 48, 48, 1, 2); // 1px margin, 2px spacing
    this.groundLayer = map.createBlankDynamicLayer("Ground", tileset).fill(TILES.BLANK);
    this.stuffLayer = map.createBlankDynamicLayer("Stuff", tileset);
    const shadowLayer = map.createBlankDynamicLayer("Shadow", tileset).fill(TILES.BLANK);

    this.tilemapVisibility = new TilemapVisibility(shadowLayer);

    // Use the array of rooms generated to place tiles in the map
    // Note: using an arrow function here so that "this" still refers to our scene

    this.dungeon.rooms.forEach(room => {
      const { x, y, width, height, left, right, top, bottom } = room;

      // Fill the floor with mostly clean tiles, but occasionally place a dirty tile
      // See "Weighted Randomize" example for more information on how to use weightedRandomize.
      this.groundLayer.weightedRandomize(x + 1, y + 1, width - 2, height - 2, TILES.FLOOR);

      // Place the room corners tiles
      this.groundLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top);
      this.groundLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom);

      // Fill the walls with mostly clean tiles, but occasionally place a dirty tile
      this.groundLayer.weightedRandomize(left + 1, top, width - 2, 1, TILES.WALL.TOP);
      this.groundLayer.weightedRandomize(left + 1, bottom, width - 2, 1, TILES.WALL.BOTTOM);
      this.groundLayer.weightedRandomize(left, top + 1, 1, height - 2, TILES.WALL.LEFT);
      this.groundLayer.weightedRandomize(right, top + 1, 1, height - 2, TILES.WALL.RIGHT);

      // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the
      // room's location. Each direction has a different door to tile mapping.
      var doors = room.getDoorLocations(); // → Returns an array of {x, y} objects
      for (var i = 0; i < doors.length; i++) {
        if (doors[i].y === 0) {
          this.groundLayer.putTilesAt(TILES.DOOR.TOP, x + doors[i].x - 1, y + doors[i].y);
        } else if (doors[i].y === room.height - 1) {
          this.groundLayer.putTilesAt(TILES.DOOR.BOTTOM, x + doors[i].x - 1, y + doors[i].y);
        } else if (doors[i].x === 0) {
          this.groundLayer.putTilesAt(TILES.DOOR.LEFT, x + doors[i].x, y + doors[i].y - 1);
        } else if (doors[i].x === room.width - 1) {
          this.groundLayer.putTilesAt(TILES.DOOR.RIGHT, x + doors[i].x, y + doors[i].y - 1);
        }
      }
    });

    // Separate out the rooms into:
    //  - The starting room (index = 0)
    //  - A random room to be designated as the end room (with stairs and nothing else)
    //  - An array of 90% of the remaining rooms, for placing random stuff (leaving 10% empty)
    const rooms = this.dungeon.rooms.slice();
    const startRoom = rooms.shift();
    const endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
    const otherRooms = Phaser.Utils.Array.Shuffle(rooms).slice(0, rooms.length * 0.9);

    // Place the stairs
    this.stuffLayer.putTileAt(TILES.STAIRS, endRoom.centerX, endRoom.centerY);

    
    // Place stuff in the 90% "otherRooms"
    var trono = true;
    var rx,ry,epx,epy;   
    otherRooms.forEach(room => {
      var rand = Math.random();
      if(!trono && epx == null){
        epx=map.tileToWorldX(room.left)+5;
        epy=map.tileToWorldX(room.bottom);
      }
      if (rand <= 0.25) {
        // 25% chance of chest
        this.stuffLayer.putTileAt(TILES.CHEST, room.centerX, room.centerY);
      } else if (rand <= 0.5) {
        // 50% chance of a pot anywhere in the room... except don't block a door!
        const x = Phaser.Math.Between(room.left + 2, room.right - 2);
        const y = Phaser.Math.Between(room.top + 2, room.bottom - 2);
        this.stuffLayer.weightedRandomize(x, y, 1, 1, TILES.POT);
      } else {
        // 25% of either 2 or 4 towers, depending on the room size
        if (room.height >= 9) {
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY + 1);
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY + 1);
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY - 2);
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY - 2);

          if(trono){            
            rx = map.tileToWorldX(room.centerX)+25;
            ry = map.tileToWorldY(room.centerY)+15;            
            trono=false;            
          }
          

        } else {
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY - 1);
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY - 1);
        }
      }
    });
    
    this.reyX=rx;
    this.reyY=ry;

    this.insectoX=epx;
    this.insectoY=epy;

    // Not exactly correct for the tileset since there are more possible floor tiles, but this will
    // do for the example.
    this.groundLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);
    this.stuffLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);

    //find a stairs
    this.stuffLayer.setTileIndexCallback(TILES.STAIRS, () => {
      this.stuffLayer.setTileIndexCallback(TILES.STAIRS, null);
      this.hasPlayerReachedStairs = true;
      this.player.freeze();
      const cam = this.cameras.main;
      cam.fade(250, 0, 0, 0);
      cam.once("camerafadeoutcomplete", () => {
        this.player.destroy();
        this.scene.restart();
      });
    });

    //find a chest
    this.stuffLayer.setTileIndexCallback(TILES.CHEST, () => {
      this.stuffLayer.setTileIndexCallback(TILES.CHEST, null);
      this.player.hasWeapon = true;
      this.weapon = TILES.CHESTWEAPONS[Math.floor(Math.random() * (3 - 0)) + 0];
      alert("Has encontrado un " + this.weapon);
      /*this.hasPlayerReachedStairs = true;
      this.player.freeze();
      const cam = this.cameras.main;
      cam.fade(250, 0, 0, 0);
      cam.once("camerafadeoutcomplete", () => {
        this.player.destroy();
        this.scene.restart();
      });*/
    });

      this.anims.create({
      key: "rey",
      frames: this.anims.generateFrameNumbers("characters", { start: 23, end: 26 }),
      frameRate: 8,
      repeat: -1
      });
      this.anims.create({
        key: "player-walk",
        frames: this.anims.generateFrameNumbers("characters", { start: 46, end: 49 }),
        frameRate: 8,
        repeat: -1
      });
      this.anims.create({
        key: 'enemigo1',
        frames: this.anims.generateFrameNumbers('antifairy', { start: 0, end: 4 }),
        frameRate: 15,
        repeat: 1
      });
      this.anims.create({
        key: 'enemigo2',
        frames: this.anims.generateFrameNumbers('insecto', { start: 0, end: 7 }),
        frameRate: 15,
        repeat: -1
      });
      
      /*this.anims.create({
        key: 'enemigo2',
        frames: this.anims.generateFrameNumbers('bladetrap', { start: 0, end: 0 }),
        frameRate: 5,
        repeat: -1
      });*/
      


    // Place the player in the first room
    const playerRoom = startRoom;
    const x = map.tileToWorldX(playerRoom.centerX);
    const y = map.tileToWorldY(playerRoom.centerY);
    this.player = new Player(this, x, y);

    this.enemigo1 = this.physics.add.sprite(x+50, y-30, 'enemigo1');
    this.enemigo1.anims.play('enemigo1',true);

    this.enemigo2 = this.physics.add.sprite(x+50,y,'bladetrap');
    //this.enemigo2.anims.play('enemigo2',true);
    

    // Watch the player and tilemap layers for collisions, for the duration of the scene:
    this.physics.add.collider(this.player.sprite, this.groundLayer);
    this.physics.add.collider(this.player.sprite, this.stuffLayer);


    //colider para la antiHada
    this.physics.add.collider(this.enemigo1, this.groundLayer);    
    this.physics.add.collider(this.enemigo1,this.player.sprite);

    //colider para las puyitas(bladetrap)
    this.physics.add.collider(this.enemigo2,this.groundLayer);
    this.physics.add.collider(this.enemigo2,this.player);
  //  this.physics.add.collider(this.enemigo2, this.stuffLayer);


    this.physics.add.overlap(this.player.sprite, this.enemigo1 , ()=>{
        this.setLife(420);
    });

    this.physics.add.overlap(this.player.sprite, this.enemigo2 , ()=>{
        this.setLife(-5);
    });

    
    //enemigo2.body.collideWorldBounds = true;

    //enemigo2.body.bounce.setTo(0.15, 0.8);


    this.enemigo1.move = this.tweens.add({
      targets: this.enemigo1,
      y: y + 180,      
      x: x + 120,
      ease: 'Linear',
      duration: 2000,
      repeat: -1,
      yoyo: true
    });
    var titulo= new Array();
    titulo.push('dust');
    titulo.push('mpa');
    this.music = this.sound.add(titulo[Math.floor(Math.random() * titulo.length)]);
    this.music.config.loop=true;
    this.music.play();
    

    


    // Phaser supports multiple cameras, but you can access the default camera like this:
    const camera = this.cameras.main;

    // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.startFollow(this.player.sprite);

    // Help text that has a "fixed" position on the screen
    //mision indicator
    this.add
      .text(16, 16, `Mision: Encuentra las escaleras.\nNivel actual: ${this.level}`, {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setScrollFactor(0);

      //life indicator
      this.setLife(100);
      /*this.add.text(450, 16, `Vida.\nNivel actual: ${this.life}%`, {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setScrollFactor(0);*/

      //weapon indicator
      this.setWeapon("");
      /*this.add.text(720, 16, `Arma.\narma actual: ${this.weapon}`, {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setScrollFactor(0);*/ 
      this.encuentro=true;     
  }

  //seting weapon indicator
  setWeapon(weaponName){
    this.weapon = weaponName;
      this.add.text(720, 16, `Arma.\narma actual: ${this.weapon}`, {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setScrollFactor(0);
  }

  //seting life indicator
  setLife(lifePercent){
    this.life = lifePercent;
    this.add.text(450, 16, `Vida.\nNivel actual: ${this.life}%`, {
      font: "18px monospace",
      fill: "#000000",
      padding: { x: 20, y: 10 },
      backgroundColor: "#ffffff"
    })
    .setScrollFactor(0);
  } 

  //esta misma aplicacara para poner a los mounstros en un cuarto 
  //y que aparezcan sin que el jugador lo vea venir

  invocarRey(){
    this.rey = new King(this, this.reyX, this.reyY);
    this.rey=this.physics.add.sprite(this.reyX, this.reyY, 'rey');            
    this.rey.anims.play('rey',true);        
    //alert("aprieten bien ese culo...\n que lo que viene es candela"); 

  }

  invocarBicho(){
    this.insecto=this.physics.add.sprite(this.insectoX+30, this.insectoY-30, 'enemigo2');            
    this.insecto.anims.play('enemigo2',true);
    this.physics.add.collider(this.insecto,this.groundLayer);        
    //alert("aprieten bien ese culo...\n que lo que viene es candela");
	console.log(this.insectoX+30, this.insectoY-30); 

  }



  update(time, delta) {
    if (this.hasPlayerReachedStairs){
      this.music.stop();
      return;
    } 
    if(this.player.hasWeapon) this.setWeapon(this.weapon);
    this.player.update();
    

    // Find the player's room using another helper method from the dungeon that converts from
    // dungeon XY (in grid units) to the corresponding room object
    const playerTileX = this.groundLayer.worldToTileX(this.player.sprite.x);
    const playerTileY = this.groundLayer.worldToTileY(this.player.sprite.y);
    const playerRoom  = this.dungeon.getRoomAt(playerTileX, playerTileY);
    if(this.encuentro){
      const palacioTileX = this.groundLayer.worldToTileX(this.reyX);
      const palacioTileY = this.groundLayer.worldToTileY(this.reyY);
      const palacio     = this.dungeon.getRoomAt(palacioTileX, palacioTileY);
      if(palacio==playerRoom){
        this.invocarRey();
        this.rey.update();
        this.encuentro=false;        
      }
    }
    if(this.insecto==null){
      const colmenaTileX = this.groundLayer.worldToTileX(this.insectoX);
      const colmenaTileY = this.groundLayer.worldToTileY(this.insectoY);
      const colmena     = this.dungeon.getRoomAt(colmenaTileX, colmenaTileY);
      if(colmena==playerRoom){
        this.invocarBicho();      
      }
    }
    
    this.tilemapVisibility.setActiveRoom(playerRoom);
  }
}
