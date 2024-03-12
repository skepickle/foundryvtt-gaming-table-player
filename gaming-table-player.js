class GamingTablePlayer {
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
		game.settings.register('gaming-table-player', 'scale', {
			name: "Scale",
			hint: "The scale at which the map should be locked",
			scope: "world",
			default: 0.5,
			type: Number,
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
		game.settings.register('gaming-table-player', 'selecttokens', {
			name: "Select Tokens",
			hint: "Select all tokens that the gaming table player owns.",
			scope: "world",
			default: true,
			type: Boolean,
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
		game.settings.register('gaming-table-player', 'hideui', {
			name: "Hide UI Elements",
			hint: "Enable this option in order to have the Gaming Table Player hide all FoundryVTT UI elements",
			scope: "world",
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'nopan2ping', {
			name: "Do Not Pan Canvas to Ping",
			hint: "Enable this option in order to prevent GM from panning the Gaming Table Player's canvas to a ping",
			scope: "world",
			default: false,
			type: Boolean,
			config: true
		});
		if (!game.modules.get('lib-wrapper')?.active && game.user.isGM) {
			ui.notifications.error("Module XYZ requires the 'libWrapper' module. Please install and activate it.");
		}
		if (game.user.name == game.settings.get('gaming-table-player','player')) {
			this.hidui = false;
			this.wrappedping = false;
			setTimeout(this.gamingTablePlayerLoop, game.settings.get('gaming-table-player','intervalspeed'));
		}
	}
	static async gamingTablePlayerLoop(){
		if (game.user.name != game.settings.get('gaming-table-player','player')) {
			//This should never be reached but try to catch it anyways.
			console.log("NOT GAMING TABLE PLAYER: "+ game.settings.get('gaming-table-player','player'));
			return;
		}
		if (game.settings.get('gaming-table-player','nopan2ping')) {
			if (!this.wrappedping) {
				libWrapper.register('gaming-table-player', 'ControlsLayer.prototype.handlePing', function (wrapped, ...args) {
						if (args.length >= 3) {
							args[2].pull = false;
						}
						let result = wrapped(...args);
						return result;
				}, 'WRAPPER' );
				this.wrappedping = true;
			}
		} else {
			if (this.wrappedping) {
				libWrapper.unregister('gaming-table-player', 'ControlsLayer.prototype.handlePing', fail=true);
				this.wrappedping = false;
			}
		}
		if (game.settings.get('gaming-table-player','hideui')) {
			if (!this.hidui) {
				$("#players").hide();
				$("#logo").hide();
				$("#hotbar").hide();
				$("#navigation").hide();
				$("#controls").hide();
				$("#sidebar").hide();
				this.hidui = true;
			}
		} else {
			if (this.hidui) {
				$("#players").show();
				$("#logo").show();
				$("#hotbar").show();
				$("#navigation").show();
				$("#controls").show();
				$("#sidebar").show();
				this.hidui = false;
			}
		}
		if (game.settings.get('gaming-table-player','selecttokens')) {
			let in_combat = false;
			let turnTokenIds = [];

			let ownedTokens = canvas.tokens.ownedTokens.slice();
			let ownedTokenIds = [];
			for (let t = 0; t < ownedTokens.length; t++) {
				ownedTokenIds.push(ownedTokens[t].id);
			}

			let apps = game.combats.apps.slice();
			for (let a = 0; a < apps.length; a++) {
				let combats = apps[a].combats.slice();
				for (let c = 0; c < combats.length; c++) {
					if (combats[c].turn != null) {
						in_combat = true;
						if (ownedTokenIds.includes(combats[c].turns[combats[c].turn].tokenId)) {
							turnTokenIds.push(combats[c].turns[combats[c].turn].tokenId);
						}
					}
				}
			}
			canvas.activeLayer.selectObjects({}, {releaseOthers: true});
			for (let t = 0; t < ownedTokens.length; t++) {
				if ((turnTokenIds.length == 0) || turnTokenIds.includes(ownedTokens[t].id)) {
					ownedTokens[t].control({releaseOthers: false});
				}
			}
		}
		setTimeout(function() {
			GamingTablePlayer.gamingTablePlayerLoop();
		}, game.settings.get('gaming-table-player','intervalspeed'));
	}
	static async listen(){
		game.socket.on('module.gaming-table-player',async data => {
			if (game.scenes.viewed._id != data.scene_id) {
				return;
			}
			if (game.user.name == game.settings.get('gaming-table-player','player')) {
				this.gamingTablePlayerLoop();
				canvas.animatePan(data.pan)
			}
		});
	}
	static async pullFocus(mouse){
		var focusdata = new Object();
		focusdata.pan = mouse;
		focusdata.pan.scale    = game.settings.get('gaming-table-player','scale');
		focusdata.scene_id     = game.scenes.viewed._id;
		game.socket.emit('module.gaming-table-player',focusdata)
	}
}

var keyDown = (e)=>{
	const KeyBinding = window.Azzu.SettingsTypes.KeyBinding;
	const parsedValue = KeyBinding.parse(game.settings.get('gaming-table-player','keymap'));
	const bind = KeyBinding.eventIsForBinding(e, KeyBinding.parse(game.settings.get('gaming-table-player','keymap')));
	if (bind && game.user.isGM && overCanvas) {
		//TODO Maybe allow centering on a token location instead of mouse position.
		var mouse = canvas.mousePosition;
		GamingTablePlayer.pullFocus(mouse);
	}
}

var overCanvas = true;	
	
window.addEventListener('keydown', keyDown);

Hooks.on('init',()=>{
	
})
Hooks.on('ready',()=>{
	GamingTablePlayer.init();
})
Hooks.on('canvasReady', ()=>{
	CONFIG.debug.hooks = true;
	canvas.stage.on('mouseover',(e)=>{
		overCanvas = true;
	})
	canvas.stage.on('mouseout',(e)=>{
		overCanvas = false;
	})
})

