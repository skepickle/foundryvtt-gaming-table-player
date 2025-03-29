class GamingTablePlayer {

	static hidUI = false;
	static handlePingIsWrapped = false;
	static refreshTimestamp = 0;
	static sceneFoci = {};
	static mouseIsOverCanvas = true;
	static Layer;
	static Container;

	static initialize() {
		game.settings.register('gaming-table-player', 'player', {
			name: 'Table Player',
			hint: 'The name of the player who\'s session is being displayed on the gaming table',
			scope: 'world',
			requiresReload: true,
			default: 'VTT',
			type: String,
			config: true
		});
		game.settings.register('gaming-table-player', 'phyScreenWidth', {
			name: 'Table Width',
			hint: 'The physical screen width using the same units as \'Table Grid Width\' below',
			scope: 'world',
			default: 42.0,
			type: Number,
			config: true
		});
		game.settings.register('gaming-table-player', 'phyGridWidth', {
			name: 'Table Grid Width',
			hint: 'The desired physical grid width using the same units as \'Table Width\' above',
			scope: 'world',
			default: 1,
			type: Number,
			config: true
		});
		game.settings.register('gaming-table-player', 'refreshPeriod', {
			name: 'Refresh Period (in ms)',
			hint: 'Period of time between refreshes to Table Player\'s view. (1000 ms = 1 second)',
			scope: 'world',
			default: 5000,
			type: Number,
			config: true
		});
		game.settings.register('gaming-table-player', 'selectTokens', {
			name: 'Select Tokens',
			hint: 'Select all tokens that the Table Player owns',
			scope: 'world',
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'hideUI', {
			name: 'Hide UI Elements',
			hint: 'Hide FoundryVTT UI elements for Table Player',
			scope: 'world',
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'noPanToTokens', {
			name: 'Do Not Pan to Tokens',
			hint: 'Prevent panning Gaming Table view when owned tokens are moved off-screen',
			scope: 'world',
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'noPanToPing', {
			name: 'Do Not Pan to Ping',
			hint: 'Prevent panning Gaming Table view when GM uses the "Pan Canvas to Ping" function',
			scope: 'world',
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'drawTableBounds', {
			name: 'Draw Table View',
			hint: 'Display the current gaming table view\'s bounds in GM\'s view',
			scope: 'world',
			requiresReload: true,
			default: false,
			type: Boolean,
			config: true
		});
		game.settings.register('gaming-table-player', 'focusOnToken', {
			name: 'Focus on Select Token',
			hint: 'If token is selected when hotkey is pressed, use it for center of focus',
			scope: 'world',
			default: false,
			type: Boolean,
			config: true
		});
		if (game.user.isGM) {
			Hooks.on('canvasReady', ()=> {
				canvas.stage.on('mouseover', (e) => {
					GamingTablePlayer.mouseIsOverCanvas = true;
				});
				canvas.stage.on('mouseout', (e) => {
					GamingTablePlayer.mouseIsOverCanvas = false;
				});
			});
			if (game.settings.get('gaming-table-player', 'drawTableBounds')) {
				Hooks.on('preUpdateScene', (s) => {
					setTimeout(GamingTablePlayer.updateBoundingBox, 500, s._id);
				});
				Hooks.on('updateScene', (s) => {
					setTimeout(GamingTablePlayer.updateBoundingBox, 500, s._id);
				});
				Hooks.on('canvasPan', (e) => {
					setTimeout(GamingTablePlayer.updateBoundingBox, 500);
				});
				GamingTablePlayer.initCanvasLayer();
			}
			if (!game.modules.get('lib-wrapper')?.active) {
				ui.notifications.error('Module XYZ requires the \'libWrapper\' module. Please install and activate it.');
			}
			GamingTablePlayer.listen();
		} else if (game.user.name == game.settings.get('gaming-table-player', 'player')) {
			Hooks.on('updateScene', (s) => {
				if (GamingTablePlayer.sceneFoci[s._id] !== undefined) {
					var data = GamingTablePlayer.sceneFoci[s._id];
					if (game.settings.get('gaming-table-player', 'drawTableBounds')) {
						data.type = 'tableBounds';
						data.width = window.innerWidth;
						data.height = window.innerHeight;
						game.socket.emit('module.gaming-table-player', data);
					}
					setTimeout(function(sid) {
						if (canvas.scene._id == s._id) {
							canvas.animatePan(data.pan);
						}
					}, 250, s._id);
				}
			});
			setTimeout(GamingTablePlayer.refreshLoop, game.settings.get('gaming-table-player', 'refreshPeriod'));
			GamingTablePlayer.listen();
		}
	}

	static async refreshLoop() {
		GamingTablePlayer.refreshTimestamp = Date.now();
		if (game.user.name != game.settings.get('gaming-table-player', 'player')) {
			//This should never be reached but try to catch it anyways.
			console.warn('Error: Gaming Table Player (set to ' +
				game.settings.get('gaming-table-player', 'player') +
				') main loop executed as user ' + game.user.name);
			return;
		}
		if (game.settings.get('gaming-table-player', 'noPanToTokens') &&
			(GamingTablePlayer.sceneFoci[game.scenes.viewed._id] !== undefined)) {
			canvas.animatePan(GamingTablePlayer.sceneFoci[game.scenes.viewed._id].pan);
		}
		if (game.settings.get('gaming-table-player', 'noPanToPing')) {
			if (!GamingTablePlayer.handlePingIsWrapped) {
				let try_again = false;
				{
					try {
						libWrapper.register('gaming-table-player', 'ControlsLayer.prototype.handlePing',
							function (wrapped, ...args) {
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
						libWrapper.register('gaming-table-player', 'ControlsLayer.prototype.handlePing',
							function (wrapped, ...args) {
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
			$('#players').hide();
			$('#logo').hide();
			$('#hotbar').hide();
			$('#navigation').hide();
			$('#controls').hide();
			$('#sidebar').hide();
			GamingTablePlayer.hidUI = true;
		} else if (GamingTablePlayer.hidUI) {
			$('#players').show();
			$('#logo').show();
			$('#hotbar').show();
			$('#navigation').show();
			$('#controls').show();
			$('#sidebar').show();
			GamingTablePlayer.hidUI = false;
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
		setTimeout(GamingTablePlayer.refreshLoop, game.settings.get('gaming-table-player', 'refreshPeriod'));
	}

	static getPhysicalScale(scene_grid_size) {
		const phyScreenWidth = game.settings.get('gaming-table-player', 'phyScreenWidth');
		const phyGridWidth = game.settings.get('gaming-table-player', 'phyGridWidth');
		const squares = phyScreenWidth / phyGridWidth; // # of grid squares on screen
		const pixelsPerGrid = screen.width / squares;  // # of pixels per grid square
		return pixelsPerGrid / scene_grid_size;
	}

	static async listen() {
		game.socket.on('module.gaming-table-player', async data => {
			switch (data.type) {
				case 'gmPullFocus':
					if (game.user.name == game.settings.get('gaming-table-player', 'player')) {
						if (!data.pan.hasOwnProperty('scale')) {
							data.pan.scale = GamingTablePlayer.getPhysicalScale(game.scenes.get(data.scene_id).grid.size);
						}
						GamingTablePlayer.sceneFoci[data.scene_id] = data;
						if (game.scenes.viewed._id == data.scene_id) {
							canvas.animatePan(data.pan);
						}
						data.type = 'tableBounds';
						data.width = window.innerWidth;
						data.height = window.innerHeight;
						game.socket.emit('module.gaming-table-player', data);
						if ((Date.now() - GamingTablePlayer.refreshTimestamp) >
							(game.settings.get('gaming-table-player', 'refreshPeriod') * 3)) {
							GamingTablePlayer.refreshLoop();
						}
					}
					break;
				case 'tableBounds':
					if (game.user.isGM && game.settings.get('gaming-table-player', 'drawTableBounds')) {
						if (data.scene_id == game.scenes.viewed._id) {
							GamingTablePlayer.sceneFoci[data.scene_id] = data;
							setTimeout(GamingTablePlayer.updateBoundingBox, 500);
						}
					}
					break;
				default:
					console.warn('Unknown data type');
					break;
			}
		});
	}

	static async pullFocus(mouse) {
		if (game.user.isGM) {
			game.socket.emit('module.gaming-table-player', {
				'type': 'gmPullFocus',
				'pan': mouse,
				'scene_id': game.scenes.viewed._id
			});
		}
	}

	static async initCanvasLayer() {
		GamingTablePlayer.Layer = new CanvasLayer();
		GamingTablePlayer.Container = new PIXI.Container();
		GamingTablePlayer.Layer.addChild(GamingTablePlayer.Container);
		canvas.stage.addChild(GamingTablePlayer.Layer);
	}

	static async updateBoundingBox(scene_id = '') {
		GamingTablePlayer.Container.removeChildren();
		if (scene_id == '') {
			scene_id = game.scenes.viewed._id;
		}
		if (GamingTablePlayer.sceneFoci[scene_id] === undefined) {
			return;
		}
		var data = GamingTablePlayer.sceneFoci[scene_id];
		const scale = data.pan.scale;
		const width = data.width / scale;
		const height = data.height / scale;
		var drawing = new PIXI.Graphics();
		var color = 0x0000FF;
		var view_type = 'Active';
		if (game.users.getName(game.settings.get('gaming-table-player', 'player')).viewedScene !== scene_id) {
			color = 0xFF0000;
			view_type = 'Inactive';
		}
		drawing.lineStyle(5, color, 0.5, 1);
		drawing.drawRect(data.pan.x - width / 2, data.pan.y - height / 2, width, height);
		var text = new PIXI.Text(
			game.settings.get('gaming-table-player', 'player') + '\'s ' + view_type + ' View',
			{fontFamily: 'Arial Black', fontSize: 24, fill: color, align: 'center'});
		text.x = data.pan.x;
		text.anchor.x = 0.5;
		text.y = data.pan.y - height / 2;
		text.anchor.y = 1.25;
		text.alpha = 0.5;
		GamingTablePlayer.Container.addChild(drawing);
		GamingTablePlayer.Container.addChild(text);
	}

}

Hooks.on('init', () => {
	game.keybindings.register('gaming-table-player', 'gamingTablePlayerTargettingHotkey', {
		name: 'Keymap',
		hint: 'The hotkey used by the GM to pull focus on the gaming table',
		editable: [
			{
				key: 'KeyT',
				modifiers: ['Control', 'Alt', 'Shift']
			}
		],
		onDown: () => {
			var mouse = canvas.mousePosition;
			if (game.settings.get('gaming-table-player', 'focusOnToken')) {
				if (canvas.tokens.controlled.length == 1) {
					mouse.x = canvas.tokens.controlled[0].center.x;
					mouse.y = canvas.tokens.controlled[0].center.y;
				}
			}
			GamingTablePlayer.pullFocus(mouse);
		},
		onUp: () => {},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
	});
	game.keybindings.register('gaming-table-player', 'gamingTablePlayerInitialViewHotkey', {
		name: 'Initial View Key',
		hint: 'The hotkey used by the GM to set scene to Initial View Position',
		editable: [
			{
				key: 'KeyI',
				modifiers: ['Control', 'Alt', 'Shift']
			}
		],
		onDown: () => {
			GamingTablePlayer.pullFocus(game.canvas.scene.initial);
		},
		onUp: () => {},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
	});
});

Hooks.on('ready', () => {
	GamingTablePlayer.initialize();
});
