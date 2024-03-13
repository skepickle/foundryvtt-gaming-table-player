class GamingTablePlayer {
	static hidui = false;
	static wrappedping = false;
	static timestamp = 0;
	static autoscale = 1;
	static Layer; static Container;
	static init() {
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
			default: 1.0,
			type: Number,
			config: true
		});
		game.settings.register('gaming-table-player', 'autoScale', {
			name: "Auto Scale",
			hint: "Set the scale based on physical size of the gaming table",
			scope: "world",
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'autoScaleWidth', {
			name: "Gaming Table width (cm/mm/inches)",
			hint: "Enter the Gaming Table width using your preferred unit. For example 950mm",
			scope: "world",
			default: 950,
			type: Number,
			config: true
		});
		game.settings.register('gaming-table-player', 'autoScaleGrid', {
			name: "Grid width (cm/mm/inches)",
			hint: "Enter the desired grid width, use the same unit as the gaming table width.For example 25mm",
			scope: "world",
			default: 25,
			type: Number,
			config: true
		});
		game.settings.register('gaming-table-player', 'drawPlayerView', {
			name: "Draw Gaming Table view",
			hint: "Get a box on the GM scene representing what is being shown on the gaming table",
			scope: "world",
			default: false,
			type: Boolean,
			config: true,
			requiresReload: true
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
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'intervalspeed', {
			name: "Refresh Duration (in milliseconds)",
			hint: "How fast to refresh gaming table view. (1000 ms = 1 second)",
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
		if (game.user.name == game.settings.get('gaming-table-player', 'player')) {
			setTimeout(GamingTablePlayer.gamingTablePlayerLoop, game.settings.get('gaming-table-player', 'intervalspeed'));

		}
		if ((game.settings.get('gaming-table-player', 'drawPlayerView') && game.user.isGM) || game.user.name == game.settings.get('gaming-table-player', 'player')) {
			GamingTablePlayer.intCanvasLayer();
			GamingTablePlayer.listen();
		}
	}
	static intCanvasLayer() {
		GamingTablePlayer.Layer = new CanvasLayer();
		GamingTablePlayer.Container = new PIXI.Container();
		GamingTablePlayer.Layer.addChild(GamingTablePlayer.Container);
		canvas.stage.addChild(GamingTablePlayer.Layer);
	}
	static async gamingTablePlayerLoop() {
		let now = Date.now();
		//console.log("gamingTablePlayerLoop() @ "+now);
		GamingTablePlayer.timestamp = now;
		if (game.user.name != game.settings.get('gaming-table-player', 'player')) {
			//This should never be reached but try to catch it anyways.
			console.warn("Error: Gaming Table Player (set to " + game.settings.get('gaming-table-player', 'player') + ") main loop executed as user " + game.user.name);
			return;
		}

		if (game.settings.get('gaming-table-player', 'nopan2ping')) {
			if (!GamingTablePlayer.wrappedping) {
				let try_again = false;
				try {
					libWrapper.register('gaming-table-player', 'ControlsLayer.prototype.handlePing', function (wrapped, ...args) {
						if (args.length >= 3) {
							args[2].pull = false;
						}
						let result = wrapped(...args);
						return result;
					}, 'WRAPPER');
					GamingTablePlayer.wrappedping = true;
				} catch (error) {
					try_again = true;
				}
				if (try_again) {
					try {
						libWrapper.unregister('gaming-table-player', 'ControlsLayer.prototype.handlePing');
					} catch (error) {
						console.warn("libWrapper.unregister() threw an exception");
					}
					try {
						libWrapper.register('gaming-table-player', 'ControlsLayer.prototype.handlePing', function (wrapped, ...args) {
							if (args.length >= 3) {
								args[2].pull = false;
							}
							let result = wrapped(...args);
							return result;
						}, 'WRAPPER');
						GamingTablePlayer.wrappedping = true;
					} catch (error) {
						console.warn("libWrapper.register() threw an exception");
					}
				}
			}
		} else {
			if (GamingTablePlayer.wrappedping) {
				try {
					libWrapper.unregister('gaming-table-player', 'ControlsLayer.prototype.handlePing');
				} catch (error) {
					console.warn("libWrapper.unregister() threw an exception");
				}
				GamingTablePlayer.wrappedping = false;
			}
		}
		if (game.settings.get('gaming-table-player', 'hideui')) {
			if (!GamingTablePlayer.hidui) {
				$("#players").hide();
				$("#logo").hide();
				$("#hotbar").hide();
				$("#navigation").hide();
				$("#controls").hide();
				$("#sidebar").hide();
				GamingTablePlayer.hidui = true;
			}
		} else {
			if (GamingTablePlayer.hidui) {
				$("#players").show();
				$("#logo").show();
				$("#hotbar").show();
				$("#navigation").show();
				$("#controls").show();
				$("#sidebar").show();
				GamingTablePlayer.hidui = false;
			}
		}
		if (game.settings.get('gaming-table-player', 'selecttokens')) {
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
			canvas.activeLayer.selectObjects({}, { releaseOthers: true });
			for (let t = 0; t < ownedTokens.length; t++) {
				if ((turnTokenIds.length == 0) || turnTokenIds.includes(ownedTokens[t].id)) {
					ownedTokens[t].control({ releaseOthers: false });
				}
			}
		}
		setTimeout(function () {
			GamingTablePlayer.gamingTablePlayerLoop();
		}, game.settings.get('gaming-table-player', 'intervalspeed'));
	}
	static async listen() {
		game.socket.on('module.gaming-table-player', async data => {
			if (game.scenes.viewed._id != data.scene_id) {
				return;
			}
			if (game.user.name == game.settings.get('gaming-table-player', 'player') && data.type == 'gmPullFocus') {
				if (Date.now() - GamingTablePlayer.timestamp > game.settings.get('gaming-table-player', 'intervalspeed') * 3) {
					GamingTablePlayer.gamingTablePlayerLoop();
				}
				if (game.settings.get('gaming-table-player', 'autoScale')) {
					data.pan.scale = GamingTablePlayer.getPhysicalScale();
				}
				canvas.animatePan(data.pan);
			}
			if (game.settings.get('gaming-table-player', 'drawPlayerView') && game.user.isGM && data.type == "playerWindow") {
				GamingTablePlayer.updateDrawing(data);
			}
		});
	}
	static async updateDrawing(data) {
		GamingTablePlayer.Container.removeChildren();
		var drawing = new PIXI.Graphics();
		let scale = data.scale;
		let width = data.width / scale;
		let height = data.height / scale;
		drawing.lineStyle(2, 0xFFFFFF, 1);
		drawing.drawRect(data.x - width / 2, data.y - height / 2, width, height);
		GamingTablePlayer.Container.addChild(drawing);
	}
	static async pullFocus(mouse) {
		let scale = game.settings.get('gaming-table-player', 'scale');
		// Called from GM session
		var focusdata = new Object();
		focusdata.type = "gmPullFocus";
		focusdata.pan = mouse;
		focusdata.pan.scale = game.settings.get('gaming-table-player', 'scale');
		focusdata.pan.scale = scale;
		focusdata.scene_id = game.scenes.viewed._id;
		game.socket.emit('module.gaming-table-player', focusdata)
	}

	// need to be executed on the vtt player screen
	static getPhysicalScale() {
		let monitorWidth = game.settings.get('gaming-table-player', 'autoScaleWidth');
		let gridWidth = game.settings.get('gaming-table-player', 'autoScaleGrid');
		let screenResolutionX = screen.width; // this will be 1920px for full hd, 2560px for 2k and so on...
		let squares = monitorWidth / gridWidth; // how many grid quares should be on the screen
		let pixelsPerGrid = screenResolutionX / squares; // how many pixels should a square contain
		return pixelsPerGrid / canvas.scene.grid.size; // we finally get the scale
	}
}

var overCanvas = true;

var keyDown = (e) => {
	const KeyBinding = window.Azzu.SettingsTypes.KeyBinding;
	const bind = KeyBinding.eventIsForBinding(e, KeyBinding.parse(game.settings.get('gaming-table-player', 'keymap')));
	if (bind && game.user.isGM && overCanvas) {
		//TODO Maybe allow centering on a token location instead of mouse position.
		var mouse = canvas.mousePosition;
		GamingTablePlayer.pullFocus(mouse);
	}
}

window.addEventListener('keydown', keyDown);

Hooks.on('ready', () => {
	GamingTablePlayer.init();
	if (game.user.name == game.settings.get('gaming-table-player', 'player')) {
		Hooks.on('canvasPan', (canvas, coords) => {
			let playerData = {
				'scene_id': game.scenes.viewed._id,
				'type': 'playerWindow',
				'width': window.innerWidth,
				'height': window.innerHeight,
				'x': coords.x,
				'y': coords.y,
				'scale': canvas.scene._viewPosition.scale
			}
			game.socket.emit('module.gaming-table-player', playerData);
		})
	}
})



Hooks.on('canvasReady', () => {
	if (game.user.isGM) {
		canvas.stage.on('mouseover', (e) => {
			overCanvas = true;
		})
		canvas.stage.on('mouseout', (e) => {
			overCanvas = false;
		})
	}
})

