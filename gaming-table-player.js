class GamingTablePlayer {
	static hidUI = false;
	static handlePingIsWrapped = false;
	static refreshTimestamp = 0;
	static sceneFoci = {};
	static mouseIsOverCanvas = true;
	static init() {
		game.settings.register('gaming-table-player', 'player', {
			name: 'Gaming Table\'s Player Name',
			hint: 'The user name of the player who\'s session is being displayed on the gaming table',
			scope: 'world',
			default: 'VTT',
			type: String,
			config: true
		});
		game.settings.register('gaming-table-player', 'keymap', {
			name: 'Keymap',
			hint: 'Enter the keymap used to pull focus on the gaming table',
			scope: 'world',
			default: 'Ctrl + Shift + Alt + T',
			type: window.Azzu.SettingsTypes.KeyBinding,
			config: true
		});
		game.settings.register('gaming-table-player', 'phyScreenWidth', {
			name: 'Gaming Table Width',
			hint: 'Enter the Gaming Table screen width using the same units as \'Grid Width\' below',
			scope: 'world',
			default: 42.0,
			type: Number,
			config: true
		});
		game.settings.register('gaming-table-player', 'phyGridWidth', {
			name: 'Grid Width',
			hint: 'Enter the desired grid width, use the same unit as \'Gaming Table Width\' above',
			scope: 'world',
			default: 1,
			type: Number,
			config: true
		});
		game.settings.register('gaming-table-player', 'refreshPeriod', {
			name: 'Refresh Period (in milliseconds)',
			hint: 'How often to refresh Gaming Table Player\'s view. (1000 ms = 1 second)',
			scope: 'world',
			default: 5000,
			type: Number,
			config: true
		});
		game.settings.register('gaming-table-player', 'selectTokens', {
			name: 'Select Tokens',
			hint: 'Select all tokens that the gaming table player owns',
			scope: 'world',
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'hideUI', {
			name: 'Hide UI Elements',
			hint: 'Enable this option in order to have the Gaming Table Player hide all FoundryVTT UI elements',
			scope: 'world',
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'noPanToTokens', {
			name: 'Do Not Pan Canvas to Tokens',
			hint: 'Enable this option in order to prevent owned tokens being moved off-screen from panning the Gaming Table Player\'s view',
			scope: 'world',
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'noPanToPing', {
			name: 'Do Not Pan Canvas to Ping',
			hint: 'Enable this option in order to prevent GM from panning the Gaming Table Player\'s view to a ping',
			scope: 'world',
			default: false,
			type: Boolean,
			config: true
		});
		if (game.user.isGM) {
			window.addEventListener('keydown', GamingTablePlayer.keyDown);
			Hooks.on('canvasReady', ()=> {
				canvas.stage.on('mouseover', (e)=> {
					GamingTablePlayer.mouseIsOverCanvas = true;
				});
				canvas.stage.on('mouseout', (e) => {
					GamingTablePlayer.mouseIsOverCanvas = false;
				});
			});
			if (!game.modules.get('lib-wrapper')?.active) {
				ui.notifications.error('Module XYZ requires the \'libWrapper\' module. Please install and activate it.');
			}
		} else if (game.user.name == game.settings.get('gaming-table-player', 'player')) {
			setTimeout(GamingTablePlayer.refreshLoop, game.settings.get('gaming-table-player', 'refreshPeriod'));
			GamingTablePlayer.listen();
		}
	}
	static async refreshLoop() {
		GamingTablePlayer.refreshTimestamp = Date.now();
		if (game.user.name != game.settings.get('gaming-table-player', 'player')) {
			//This should never be reached but try to catch it anyways.
			console.warn('Error: Gaming Table Player (set to ' + game.settings.get('gaming-table-player', 'player') + ') main loop executed as user ' + game.user.name);
			return;
		}
		if (game.settings.get('gaming-table-player', 'noPanToTokens') && (GamingTablePlayer.sceneFoci[game.scenes.viewed._id] !== undefined)) {
			canvas.pan(GamingTablePlayer.sceneFoci[game.scenes.viewed._id]);
		}
		if (game.settings.get('gaming-table-player', 'noPanToPing')) {
			if (!GamingTablePlayer.handlePingIsWrapped) {
				let try_again = false;
				{
					try {
						libWrapper.register('gaming-table-player', 'ControlsLayer.prototype.handlePing', function (wrapped, ...args) {
								if (args.length >= 3) {
									args[2].pull = false;
								}
								let result = wrapped(...args);
								return result;
						}, 'WRAPPER');
						GamingTablePlayer.handlePingIsWrapped = true;
					} catch (error) {
						try_again = true;
					}
				}
				if (try_again) {
					try {
						libWrapper.unregister('gaming-table-player', 'ControlsLayer.prototype.handlePing');
					} catch (error) {
						console.warn('libWrapper.unregister() threw an exception');
					}
					try {
						libWrapper.register('gaming-table-player', 'ControlsLayer.prototype.handlePing', function (wrapped, ...args) {
								if (args.length >= 3) {
									args[2].pull = false;
								}
								let result = wrapped(...args);
								return result;
						}, 'WRAPPER');
						GamingTablePlayer.handlePingIsWrapped = true;
					} catch (error) {
						console.warn('libWrapper.register() threw an exception');
					}
				}
			}
		} else {
			if (GamingTablePlayer.handlePingIsWrapped) {
				try {
					libWrapper.unregister('gaming-table-player', 'ControlsLayer.prototype.handlePing');
				} catch (error) {
					console.warn('libWrapper.unregister() threw an exception');
				}
				GamingTablePlayer.handlePingIsWrapped = false;
			}
		}
		if (game.settings.get('gaming-table-player', 'hideUI')) {
			if (!GamingTablePlayer.hidUI) {
				$('#players').hide();
				$('#logo').hide();
				$('#hotbar').hide();
				$('#navigation').hide();
				$('#controls').hide();
				$('#sidebar').hide();
				GamingTablePlayer.hidUI = true;
			}
		} else {
			if (GamingTablePlayer.hidUI) {
				$('#players').show();
				$('#logo').show();
				$('#hotbar').show();
				$('#navigation').show();
				$('#controls').show();
				$('#sidebar').show();
				GamingTablePlayer.hidUI = false;
			}
		}
		if (game.settings.get('gaming-table-player', 'selectTokens')) {
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
		setTimeout(function() {
			GamingTablePlayer.refreshLoop();
		}, game.settings.get('gaming-table-player', 'refreshPeriod'));
	}
	static getPhysicalScale() {
		let phyScreenWidth = game.settings.get('gaming-table-player', 'phyScreenWidth');
		let phyGridWidth = game.settings.get('gaming-table-player', 'phyGridWidth');
		let squares = phyScreenWidth / phyGridWidth; // how many grid quares should be on the screen
		let pixelsPerGrid = screen.width / squares; // how many pixels should a square contain
		return pixelsPerGrid / canvas.scene.grid.size; // we finally get the scale
	}
	static async listen() {
		game.socket.on('module.gaming-table-player', async data => {
			if (game.scenes.viewed._id != data.scene_id) {
				return;
			}
			if (game.user.name == game.settings.get('gaming-table-player', 'player')) {
				data.pan.scale = GamingTablePlayer.getPhysicalScale();
				canvas.pan(data.pan);
				GamingTablePlayer.sceneFoci[data.scene_id] = data.pan;
				if ((Date.now() - GamingTablePlayer.refreshTimestamp) > (game.settings.get('gaming-table-player', 'refreshPeriod') * 3)) {
					GamingTablePlayer.refreshLoop();
				}
			}
		});
	}
	static async pullFocus(mouse) {
		// Called from GM session
		var focusdata = new Object();
		focusdata.type = 'gmPullFocus';
		focusdata.pan = mouse;
		focusdata.scene_id = game.scenes.viewed._id;
		game.socket.emit('module.gaming-table-player', focusdata);
	}
	static async keyDown(e) {
		if (game.user.isGM && GamingTablePlayer.mouseIsOverCanvas && window.Azzu.SettingsTypes.KeyBinding.eventIsForBinding(e, window.Azzu.SettingsTypes.KeyBinding.parse(game.settings.get('gaming-table-player', 'keymap')))) {
			//TODO Maybe allow centering on a token location instead of mouse position.
			var mouse = canvas.mousePosition;
			GamingTablePlayer.pullFocus(mouse);
		}
	}
}

//Hooks.on('init', () => {
//
//})
Hooks.on('ready', () => {
	GamingTablePlayer.init();
})
