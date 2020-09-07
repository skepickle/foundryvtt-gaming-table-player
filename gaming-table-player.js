
class PullFocus {
	static init() {
		this.listen();
		game.settings.register('gaming-table-player', 'player', {
			name: "Gaming Table's Player Name",
			hint: "The user name of the player who's session is being displayed on the gaming table",
			scope: "world",
			config: true,
			default: "VTT",
			type: String
		});
		game.settings.register('gaming-table-player', 'scale', {
			name: "Scale",
			hint: "The scale at which the map should be locked",
			scope: "world",
			config: true,
			default: 0.5,
			type: Number
		});
		game.settings.register('gaming-table-player', 'speed', {
			name: "Duration (in MS)",
			hint: "How fast or slow to transition to focus point. (1000ms = 1 second)",
			scope: "world",
			config: true,
			default: 250,
			type: Number
			//onChange: x => window.location.reload()
		});
	}
	static async gamingTablePlayerLoop(){
		//THE FOLLOWING SHOULD MOVE TO A DIFFERENT TRIGGERING MECHANISM
		let in_combat = false;
		let in_combat_id = null;
		for (let i = 0; i < game.combats.apps.length; i++) {
			if ((game.combats.apps[i].combat) &&
			    (game.combats.apps[i].combat.started)) {
				for (let j = 0; j < canvas.tokens.ownedTokens.length; j++) {
					if (canvas.tokens.ownedTokens[j].id == game.combats.apps[i].combat.current.tokenId) {
				          in_combat = true;
				          in_combat_id = game.combats.apps[i].combat.current.tokenId;
					}
				}
			}
		}
		let releaseOth = true;
		canvas.activeLayer.selectObjects({}, {releaseOthers: true});
		for (let i = 0; i < canvas.tokens.ownedTokens.length; i++) {
			if ((!in_combat) ||
			    (in_combat && (in_combat_id == canvas.tokens.ownedTokens[i].id))) {
				canvas.tokens.ownedTokens[i].control({releaseOthers: false});
				releaseOth = false;
				//console.log("GAME TABLE : "+canvas.tokens.ownedTokens[i].name);
			}
		}
		setInterval(this.gamingTablePlayerLoop, 1000);
	}
	static async listen(){
		game.socket.on('module.gaming-table-player',async data => {
			if (game.user.name == game.settings.get('gaming-table-player','player')) {
				await this.gamingTablePlayerLoop();
				await canvas.animatePan(data)
			}
		});
	}
	static async pullFocus(data){
		data.scale    = game.settings.get('gaming-table-player','scale');
		data.duration = game.settings.get('gaming-table-player','speed');
		game.socket.emit('module.gaming-table-player',data)
	}
}

var keyDown = (e)=>{
	//console.log(e.which)
	console.log('pullfocus keyDown')
	//TODO Make this use a configurable hotkey istead of just T.
	if(e.key == "T" && e.altKey && e.ctrlKey && e.shiftKey && game.user.isGM && overCanvas){
		//TODO Maybe make sure we're on the right scene before pulling focus.
		var mouse = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.tokens);
		//console.log(mouse);
	 	PullFocus.pullFocus(mouse);
	}
}
//var pullFocus = () => console.log('pullFocus',mouseX,mouseY);
var overCanvas = true;	
	
window.addEventListener('keydown', keyDown);

Hooks.on('init',()=>{
	
})
Hooks.on('ready',()=>{
	PullFocus.init();
})
Hooks.on('canvasReady', ()=>{
	//console.log('test canvasReady asdasdasd')
	 //window.addEventListener('keydown', keyDown);
	 CONFIG.debug.hooks = true;
	 //game.socket.on('pullFocus',pullFocus)
	// game.socket.on('pullFocus',pullFocus);
	canvas.stage.on('mouseover',(e)=>{
	
		overCanvas = true;
	})
	canvas.stage.on('mouseout',(e)=>{
		
		overCanvas = false;
	})
})


