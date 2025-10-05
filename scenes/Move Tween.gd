# CameraMover.gd（Godot 3.x）
extends Camera

export(NodePath) var move_tween_path
export(NodePath) var cam_targets_path     # 指到 CamTargets
export(NodePath) var stage_plane_path     # 指到 StagePlane（用來取得舞台的Z=0）

export var move_time := 1.2

onready var tw  = get_node(move_tween_path)
onready var tgt = get_node(cam_targets_path)
onready var stage_plane = get_node(stage_plane_path)

func _ready():
	if !current:
		current = true

func go_to_marker(marker_name: String):
	if !tgt or !tw: return
	var m = tgt.get_node_or_null(marker_name)
	if m == null: return

	# 目標 Transform：位置=標記點、朝向=舞台平面上的對應點（Z=0）
	var target_t = Transform()
	target_t.origin = m.translation
	var look_point = Vector3(m.translation.x, m.translation.y, 0)  # 舞台在 Z=0
	target_t = target_t.looking_at(look_point, Vector3.UP)

	# 製作補間
	if tw.is_active(): tw.stop_all()
	tw.interpolate_property(self, "transform",
		transform, target_t, move_time,
		Tween.TRANS_SINE, Tween.EASE_IN_OUT)
	tw.start()

