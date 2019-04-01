export default class MapEditor extends Phaser.Scene {
    constructor(){
        super({key: "MapEditor"});
    }

    preload(){
        
    }
    
    create(){
        this.text = this.add.text(0,0, "Map Editor");
        
        this.dungeonConfig = {
            maxRooms: prompt("Ingrese cantidad de cuartos")
        }

        this.input.keyboard.on('keyup', function(e){
            if(e.key == '1'){
              this.scene.start("DungeonScene", this.dungeonConfig);
            }
          }, this);
    }

    
}  