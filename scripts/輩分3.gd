extends Camera

# ---- UI 連結 ----
export (NodePath) var ui_panel_path
export (NodePath) var title_label_path
export (NodePath) var body_label_path
export var ray_length := 200.0

# ---- 鏡頭移動 ----
export (NodePath) var move_tween_path
export (NodePath) var cam_targets_path
export (NodePath) var stage_plane_path
export var move_time := 2.5

# ---- 可選 LookTarget ----
export (NodePath) var look_target_path

const WIDE_VIEW := "WideView"

onready var ui_panel     = null
onready var title_label  = null
onready var body_label   = null
onready var tw           = null
onready var tgt          = null
onready var stage_plane  = null
onready var look_target  = null


func _ready():
	if ui_panel_path:     ui_panel    = get_node(ui_panel_path)
	if title_label_path:  title_label = get_node(title_label_path)
	if body_label_path:   body_label  = get_node(body_label_path)
	if move_tween_path:   tw          = get_node(move_tween_path)
	if cam_targets_path:  tgt         = get_node(cam_targets_path)
	if stage_plane_path:  stage_plane = get_node(stage_plane_path)
	if look_target_path:  look_target = get_node(look_target_path)

	current = true
	if ui_panel:
		ui_panel.visible = false

	# RichTextLabel 設定與訊號（Godot 3）
	if body_label:
		body_label.bbcode_enabled = true
		body_label.mouse_filter = Control.MOUSE_FILTER_STOP
		body_label.scroll_active = false
		if not body_label.is_connected("meta_clicked", self, "_on_body_meta_clicked"):
			body_label.connect("meta_clicked", self, "_on_body_meta_clicked")


# 顯示內容（3.x 用 parse_bbcode）
func show_body(txt: String) -> void:
	if not body_label:
		return
	body_label.clear()
	body_label.parse_bbcode(txt)
	if ui_panel:
		ui_panel.visible = true


func _input(_event):
	pass


func _unhandled_input(event):
	# ESC 關閉面板
	if event is InputEventKey and event.pressed and event.scancode == KEY_ESCAPE:
		if ui_panel:
			ui_panel.visible = false
		return

	# 滑鼠左鍵射線檢測
	if event is InputEventMouseButton and event.button_index == BUTTON_LEFT and event.pressed:
		var from = project_ray_origin(event.position)
		var to   = from + project_ray_normal(event.position) * ray_length
		var hit  = get_world().direct_space_state.intersect_ray(from, to, [], 0x7FFFFFFF, true, true)

		if hit.empty():
			if ui_panel: ui_panel.visible = false
			go_to_marker(WIDE_VIEW, 1.2)
			return

		var h = hit.collider
		if h == null or not h.is_in_group("hotspot"):
			if ui_panel: ui_panel.visible = false
			go_to_marker(WIDE_VIEW, 1.2)
			return

		# 熱區資訊
		if h.has_method("get_hotspot_info") and ui_panel and title_label and body_label:
			var info = h.get_hotspot_info()
			title_label.text = str(info.title)

			var txt = str(info.body)

			# ✅ 這裡確保有 URL 並用 BBCode 包起來
			if info.has("link") and str(info.link) != "":
				var link = str(info.link)
				txt += "\n\n[color=skyblue][u][url=%s]👉 點我前往連結[/url][/u][/color]" % link

			show_body(txt)

		# 鏡頭移動
		if h.has_method("get"):
			var fm = h.get("focus_marker")
			if typeof(fm) == TYPE_STRING and fm != "":
				go_to_marker(fm)

		# 播放音效（可選）
		if h.has_method("play_audio"):
			h.play_audio()


# 點擊連結
func _on_body_meta_clicked(meta):
	var url = str(meta)
	print("META =", url)
	if OS.get_name() == "HTML5":
		JavaScript.eval("window.open('%s','_blank');" % url, true)
	else:
		OS.shell_open(url)


# 鏡頭移動
func go_to_marker(marker_name: String, duration: float = -1.0):
	if tgt == null or tw == null:
		return
	var m = tgt.get_node_or_null(marker_name)
	if m == null:
		return

	var target_t = global_transform
	target_t.origin = m.global_transform.origin

	var look_pos : Vector3
	if look_target != null:
		look_pos = look_target.global_transform.origin
	else:
		var plane_z := 0.0
		if stage_plane != null:
			plane_z = stage_plane.global_transform.origin.z
		look_pos = Vector3(target_t.origin.x, target_t.origin.y, plane_z)

	if look_pos.distance_to(target_t.origin) < 0.001:
		look_pos.z += 0.001

	target_t = target_t.looking_at(look_pos, Vector3.UP)

	var dur = duration
	if dur <= 0.0:
		dur = move_time

	if tw.is_active():
		tw.stop_all()
	tw.interpolate_property(self, "transform", transform, target_t, dur, Tween.TRANS_SINE, Tween.EASE_IN_OUT)
	tw.start()
