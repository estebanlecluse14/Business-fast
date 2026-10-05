class_name GameManager
extends Node

signal turn_changed(player_index: int)
signal player_moved(player_index: int, from_space: int, to_space: int)
signal game_started

var players: Array[Dictionary] = []
var current_player: int = 0
var round_number: int = 1
var game_started_flag := false

func start_game(names: Array[String]) -> void:
	players.clear()
	for player_name in names:
		players.append({
			"name": player_name,
			"money": GameData.START_MONEY,
			"position": 0,
			"properties": [],
			"beaches": 0,
			"active": true
		})
	current_player = 0
	round_number = 1
	game_started_flag = true
	game_started.emit()
	turn_changed.emit(current_player)

func active_player() -> Dictionary:
	if players.is_empty():
		return {}
	return players[current_player]

func move_current_player(steps: int) -> void:
	if players.is_empty() or steps <= 0:
		return
	var player := players[current_player]
	var old_position: int = int(player["position"])
	var new_position := (old_position + steps) % GameData.BOARD_SPACE_COUNT
	if old_position + steps >= GameData.BOARD_SPACE_COUNT:
		player["money"] = int(player["money"]) + GameData.START_BONUS
	player["position"] = new_position
	players[current_player] = player
	player_moved.emit(current_player, old_position, new_position)

func next_turn() -> void:
	if players.is_empty():
		return
	var previous := current_player
	for _i in range(players.size()):
		current_player = (current_player + 1) % players.size()
		if bool(players[current_player].get("active", true)):
			break
	if current_player <= previous:
		round_number += 1
	turn_changed.emit(current_player)
