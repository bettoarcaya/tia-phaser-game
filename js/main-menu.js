export default class MainMenu extends Phaser.Scene {
    constructor(){
        super({key: "MainMenu"});
    }
    
    create(){
        this.text = this.add.text(0,0, "Game Menu - Press 1 to Start Game - Press 2 to Map Editor");

        this.input.keyboard.on('keyup', function(e){
            if(e.key == '1'){
              this.scene.start("DungeonScene");
            }
            if(e.key == '2'){
                this.scene.start("MapEditor");
              }
          }, this);
    }
}  