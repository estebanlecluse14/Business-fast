extends Node

@onready var game_manager: GameManager = $GameManager
@onready var turn_label: Label = $UI/HUD/TurnPanel/VBox/TurnLabel
@onready var status_label: Label = $UI/HUD/StatusLabel

func _ready() -> void:
	game_manager.turn_changed.connect(_on_turn_changed)
	game_manager.player_moved.connect(_on_player_moved)
	game_manager.start_game(["Esteban", "Joueur 2", "Joueur 3", "Joueur 4"])
	status_label.text = "Base Godot chargée · 36 cases · architecture prête"

func _on_turn_changed(player_index: int) -> void:
	var player := game_manager.players[player_index]
	turn_label.text = "%s · Tour %d" % [player["name"], game_manager.round_number]

func _on_player_moved(player_index: int, _from_space: int, to_space: int) -> void:
	var player := game_manager.players[player_index]
	status_label.text = "%s arrive sur %s" % [player["name"], GameData.space_name(to_space)]
