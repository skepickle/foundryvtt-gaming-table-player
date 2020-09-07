
class PullFocus {
	static init() {
		this.listen();
		game.settings.register('gaming-table-player', 'player', {
			name: "Gaming Table's Player Name",
			hint: "The user name of the player who's session is being displayed on the gaming table",
			scope: "world",
			default: "VTT",
			type: String,
			config: true
		});
		game.settings.register('gaming-table-player', 'panscale', {
			name: "Pan Scale",
			hint: "The scale at which the map should be locked",
			scope: "world",
			default: 0.5,
			type: Number,
			config: true
		});
		game.settings.register('gaming-table-player', 'panspeed', {
			name: "Pan Duration (in MS)",
			hint: "How fast or slow to transition to focus point. (1000ms = 1 second)",
			scope: "world",
			default: 250,
			type: Number,
			//onChange: x => window.location.reload()
			config: true
		});
		game.settings.register('gaming-table-player', 'intervalspeed', {
			name: "Refresh Duration (in MS)",
			hint: "How fast or slow to refresh gaming table token selections. (1000ms = 1 second)",
			scope: "world",
			default: 5000,
			type: Number,
			//onChange: x => window.location.reload()
			config: true
		});
		game.settings.register('gaming-table-player', 'keymap', {
			name: "Keymap",
			hint: "Enter the keymap used to pull focus on the gaming table",
			scope: "world",
			default: "t",
			type: window.Azzu.SettingsTypes.KeyBinding,
			config: true
		});
		if (game.user.name == game.settings.get('gaming-table-player','player')) {
			//console.log("setTimeout! " + game.settings.get('gaming-table-player','intervalspeed'));
			setTimeout(this.gamingTablePlayerLoop, game.settings.get('gaming-table-player','intervalspeed'));
		}
	}
	static async gamingTablePlayerLoop(){
		if (game.user.name != game.settings.get('gaming-table-player','player')) {
			//This should never be reached
			console.log("NOT GAMING TABLE PLAYER: "+ game.settings.get('gaming-table-player','player'));
			return;
		}
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
			if (//(!in_combat) ||
			    (in_combat && (in_combat_id == canvas.tokens.ownedTokens[i].id))) {
				canvas.tokens.ownedTokens[i].control({releaseOthers: false});
				releaseOth = false;
				//console.log("GAME TABLE : "+canvas.tokens.ownedTokens[i].name);
			}
		}
		//console.log("setTimeout!! " + game.settings.get('gaming-table-player','intervalspeed'))
		setTimeout(function() {
			PullFocus.gamingTablePlayerLoop();
		}, game.settings.get('gaming-table-player','intervalspeed'));
	}
	static async listen(){
		game.socket.on('module.gaming-table-player',async data => {
			this.gamingTablePlayerLoop();
			if (game.user.name == game.settings.get('gaming-table-player','player')) {
				canvas.animatePan(data)
			}
		});
	}
	static async pullFocus(data){
		data.scale    = game.settings.get('gaming-table-player','panscale');
		data.duration = game.settings.get('gaming-table-player','panspeed');
		game.socket.emit('module.gaming-table-player',data)
	}
}

var keyDown = (e)=>{
	const KeyBinding = window.Azzu.SettingsTypes.KeyBinding;
	//console.log(e.which)
	//console.log('pullfocus keyDown')
	//TODO Make this use a configurable hotkey istead of just T.
	const parsedValue = KeyBinding.parse(game.settings.get('gaming-table-player','keymap'));
	const bind = KeyBinding.eventIsForBinding(e, parsedValue);
	if (bind && game.user.isGM && overCanvas) {
	//if(e.key == "T" && e.altKey && e.ctrlKey && e.shiftKey && game.user.isGM && overCanvas){
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


