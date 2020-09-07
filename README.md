[![foundry-shield]][foundry-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![All Release Downloads](https://img.shields.io/github/downloads/skepickle/foundryvtt-gaming-table-player/total.svg)]()

<br />
<p align="center">
  <h3 align="center">Gaming Table Player - Gaming Table module for FoundryVTT</h3>
  <p align="center">
    A module for FoundryVTT to allow for control of a utility-player logged in via a gaming table.
    <br />
    <br />
    <a href="https://github.com/skepickle/foundryvtt-gaming-table-player/issues">Report Bug / Request Feature</a>
  </p>
</p>

# Gaming Table Player
Forces a designated user's view to focus on a specific point, with a configurable zoom scale.

Press 'T' (or configurable hotkey) on the canvas and the designated user will be panned and zoomed to where your mouse is located.

Also, the designated user will always select all tokens on the board for which it has "owner" permission. This allows the gaming table to always show the combined vision for the player-characters. During combat, this behavior is changed to only show the vision for the player character who has the current turn. If it is the turn of a character not owned by the designated user, then the behavior goes back to showing the combined vision for all the player characters.

Can change the speed of the transition in settings.

## License

Gaming Table Player is a module for Foundry VTT by Skepickle and is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development from May 29, 2020](https://foundryvtt.com/article/license/).

[foundry-shield]: https://img.shields.io/badge/Foundry-v0.6.6-informational
[foundry-url]: https://foundryvtt.com/
[forks-shield]: https://img.shields.io/github/forks/skepickle/foundryvtt-gaming-table-player.svg?style=flat-square
[forks-url]: https://github.com/skepickle/foundryvtt-gaming-table-player/network/members
[stars-shield]: https://img.shields.io/github/stars/skepickle/foundryvtt-gaming-table-player.svg?style=flat-square
[stars-url]: https://github.com/skepickle/foundryvtt-gaming-table-player/stargazers
[issues-shield]: https://img.shields.io/github/issues/skepickle/foundryvtt-gaming-table-player.svg?style=flat-square
[issues-url]: https://github.com/skepickle/foundryvtt-gaming-table-player/issues
