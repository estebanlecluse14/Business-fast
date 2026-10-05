class_name BusinessBoard
extends Node2D

const COLS := 10
const ROWS := 10
const TILE_W := 92.0
const TILE_H := 58.0
const BOARD_X := 70.0
const BOARD_Y := 45.0

var tile_rects: Array[Rect2] = []

func _ready() -> void:
	_build_tile_rects()
	queue_redraw()

func _draw() -> void:
	# Fond général
	draw_rect(Rect2(0, 0, 1080, 610), Color("#d4b06b"), true)
	draw_rect(Rect2(10, 10, 1060, 590), Color("#f2dfb4"), true)

	# Centre Business City
	draw_rect(Rect2(210, 145, 660, 320), Color("#dcefe8"), true)
	draw_rect(Rect2(232, 167, 616, 276), Color("#c8e3d9"), true)

	var font := ThemeDB.fallback_font
	for i in range(tile_rects.size()):
		var rect := tile_rects[i]
		var kind := GameData.space_type(i)
		var fill := _tile_color(kind)
		draw_rect(rect, fill, true)
		draw_rect(rect, Color("#7c6a4d"), false, 1.0)

		var label := GameData.space_name(i)
		var font_size := 11
		var text_pos := rect.position + Vector2(6, 18)
		draw_string(font, text_pos, label, HORIZONTAL_ALIGNMENT_LEFT, rect.size.x - 12, font_size, Color("#1d2833"))

	# Titre central
	draw_string(font, Vector2(392, 292), "BUSINESS", HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color("#1f5262"))
	draw_string(font, Vector2(424, 330), "CITY", HORIZONTAL_ALIGNMENT_LEFT, -1, 42, Color("#173947"))

func _tile_color(kind: String) -> Color:
	match kind:
		"start":
			return Color("#f6c94a")
		"bank":
			return Color("#bbdefb")
		"jail":
			return Color("#ffcdd2")
		"event":
			return Color("#e1bee7")
		"global":
			return Color("#b2dfdb")
		"beach":
			return Color("#ffe0a3")
		_:
			return Color("#fffaf0")

func _build_tile_rects() -> void:
	tile_rects.clear()
	# Même logique visuelle que le prototype web : 10 cases par côté avec coins partagés.
	for i in range(GameData.BOARD_SPACE_COUNT):
		var pos := _board_pos(i)
		var x := BOARD_X + float(pos.x) * TILE_W
		var y := BOARD_Y + float(pos.y) * TILE_H
		tile_rects.append(Rect2(x, y, TILE_W, TILE_H))

func _board_pos(index: int) -> Vector2i:
	var j := (index + 18) % 36
	if j <= 9:
		return Vector2i(j, 0)
	if j <= 18:
		return Vector2i(9, j - 9)
	if j <= 27:
		return Vector2i(27 - j, 9)
	return Vector2i(0, 36 - j)
