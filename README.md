[![foundry-shield]][foundry-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![All Release Downloads](https://img.shields.io/github/downloads/skepickle/foundryvtt-gaming-table-player/total.svg)]()

<br />
<p align="center">
  <h3 align="center">Gaming Table Player - Gaming Table module for FoundryVTT</h3>
  <p align="center">
    A module for FoundryVTT to allow for remote control of a gaming table.
    <br />
    <br />
    <a href="https://github.com/skepickle/foundryvtt-gaming-table-player/issues">Report Bug / Request Feature</a>
  </p>
</p>

# Gaming Table Player
Forces a designated player's view to focus on a specific point in a scene, with a configurable zoom scale, using a configurable hotkey that the GM can use.

The GM can press the hotkey while their mouse pointer is over a spot in the scene that is active for the designated player. When this is done, the designated player's view will be panned and zoomed to where the GM's mouse is located.

The refresh duration that the designated player's view is updated when not triggered by the GM using the hotkey is configurable in the module settings. The default is 5 seconds (5000ms)

In addition to this behavior, there are also some optional behaviors that can be enabled via checkboxes in the Gaming Table Player settings configurations:

## Select Tokens

When this option is enabled, the designated player will select all tokens on the board for which it has "owner" permission. This allows the gaming table to always show the combined vision for the player-characters. During combat, this behavior is changed to only show the vision for the player character which has the current turn. If it is the turn of a character not owned by the designated player, then the behavior goes back to showing the combined vision for all the player characters.

## Hide UI Elements

When this option is enabled, the designated player's view will have the FoundryVTT UI elements hidden. This can be useful if the gaming table player's view is a shared screen that nobody is directly interacting with, therefore those UI elements are not useful and only get in the way.

## Do Not Pan Canvas to Ping

When this option is enabled, the core FoundryVTT "Pan Canvas to Ping" functionality is disabled for the gaming table player.

## License

Gaming Table Player is a module for Foundry VTT by Skepickle and is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development from May 29, 2020](https://foundryvtt.com/article/license/).

[foundry-shield]: https://img.shields.io/badge/Foundry-v10-informational
[foundry-url]: https://foundryvtt.com/
[forks-shield]: https://img.shields.io/github/forks/skepickle/foundryvtt-gaming-table-player.svg?style=flat-square
[forks-url]: https://github.com/skepickle/foundryvtt-gaming-table-player/network/members
[stars-shield]: https://img.shields.io/github/stars/skepickle/foundryvtt-gaming-table-player.svg?style=flat-square
[stars-url]: https://github.com/skepickle/foundryvtt-gaming-table-player/stargazers
[issues-shield]: https://img.shields.io/github/issues/skepickle/foundryvtt-gaming-table-player.svg?style=flat-square
[issues-url]: https://github.com/skepickle/foundryvtt-gaming-table-player/issues
