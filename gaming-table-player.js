class GamingTablePlayer {
	static hidui = false;
	static wrappedping = false;
	static timestamp = 0;
	static scene_foci = {};
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
			default: 't',
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
		game.settings.register('gaming-table-player', 'refreshperiod', {
			name: 'Refresh Period (in milliseconds)',
			hint: 'How often to refresh Gaming Table Player\'s view. (1000 ms = 1 second)',
			scope: 'world',
			default: 5000,
			type: Number,
			config: true
		});
		game.settings.register('gaming-table-player', 'selecttokens', {
			name: 'Select Tokens',
			hint: 'Select all tokens that the gaming table player owns',
			scope: 'world',
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'hideui', {
			name: 'Hide UI Elements',
			hint: 'Enable this option in order to have the Gaming Table Player hide all FoundryVTT UI elements',
			scope: 'world',
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'nopan2ping', {
			name: 'Do Not Pan Canvas to Ping',
			hint: 'Enable this option in order to prevent GM from panning the Gaming Table Player\'s view to a ping',
			scope: 'world',
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'nopan2token', {
			name: 'Do Not Pan Canvas to Tokens',
			hint: 'Enable this option in order to prevent owned tokens being moved off-screen from panning the Gaming Table Player\'s view',
			scope: 'world',
			default: false,
			type: Boolean,
			config: true
		});
		if (!game.modules.get('lib-wrapper')?.active && game.user.isGM) {
			ui.notifications.error('Module XYZ requires the \'libWrapper\' module. Please install and activate it.');
		}
		if (game.user.name == game.settings.get('gaming-table-player','player')) {
			setTimeout(GamingTablePlayer.gamingTablePlayerLoop, game.settings.get('gaming-table-player', 'refreshperiod'));
			GamingTablePlayer.listen();
		}
	}
	static async gamingTablePlayerLoop() {
		let now = Date.now();
		//console.log('gamingTablePlayerLoop() @ ' + now);
		GamingTablePlayer.timestamp = now;
		if (game.user.name != game.settings.get('gaming-table-player', 'player')) {
			//This should never be reached but try to catch it anyways.
			console.warn('Error: Gaming Table Player (set to ' + game.settings.get('gaming-table-player', 'player') + ') main loop executed as user ' + game.user.name);
			return;
		}
		if (game.settings.get('gaming-table-player', 'nopan2token') && (GamingTablePlayer.scene_foci[game.scenes.viewed._id] !== undefined)) {
			canvas.pan(GamingTablePlayer.scene_foci[game.scenes.viewed._id]);
		}
		if (game.settings.get('gaming-table-player', 'nopan2ping')) {
			if (!GamingTablePlayer.wrappedping) {
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
						GamingTablePlayer.wrappedping = true;
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
						GamingTablePlayer.wrappedping = true;
					} catch (error) {
						console.warn('libWrapper.register() threw an exception');
					}
				}
			}
		} else {
			if (GamingTablePlayer.wrappedping) {
				try {
					libWrapper.unregister('gaming-table-player', 'ControlsLayer.prototype.handlePing');
				} catch (error) {
					console.warn('libWrapper.unregister() threw an exception');
				}
				GamingTablePlayer.wrappedping = false;
			}
		}
		if (game.settings.get('gaming-table-player', 'hideui')) {
			if (!GamingTablePlayer.hidui) {
				$('#players').hide();
				$('#logo').hide();
				$('#hotbar').hide();
				$('#navigation').hide();
				$('#controls').hide();
				$('#sidebar').hide();
				GamingTablePlayer.hidui = true;
			}
		} else {
			if (GamingTablePlayer.hidui) {
				$('#players').show();
				$('#logo').show();
				$('#hotbar').show();
				$('#navigation').show();
				$('#controls').show();
				$('#sidebar').show();
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
		setTimeout(function() {
			GamingTablePlayer.gamingTablePlayerLoop();
		}, game.settings.get('gaming-table-player', 'refreshperiod'));
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
				GamingTablePlayer.scene_foci[data.scene_id] = data.pan;
				if ((Date.now() - GamingTablePlayer.timestamp) > (game.settings.get('gaming-table-player', 'refreshperiod') * 3)) {
					GamingTablePlayer.gamingTablePlayerLoop();
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
}

var overCanvas = true;

var keyDown = (e) => {
	const KeyBinding = window.Azzu.SettingsTypes.KeyBinding;
	const parsedValue = KeyBinding.parse(game.settings.get('gaming-table-player', 'keymap'));
	const bind = KeyBinding.eventIsForBinding(e, KeyBinding.parse(game.settings.get('gaming-table-player', 'keymap')));
	if (bind && game.user.isGM && overCanvas) {
		//TODO Maybe allow centering on a token location instead of mouse position.
		var mouse = canvas.mousePosition;
		GamingTablePlayer.pullFocus(mouse);
	}
}

window.addEventListener('keydown', keyDown);

//Hooks.on('init', () => {
//
//})
Hooks.on('ready', () => {
	GamingTablePlayer.init();
})
if (game.user.isGM) {
	Hooks.on('canvasReady', ()=> {
		canvas.stage.on('mouseover', (e)=> {
			overCanvas = true;
		});
		canvas.stage.on('mouseout', (e) => {
			overCanvas = false;
		});
	})
}
