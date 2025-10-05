extends Area

# 熱區顯示與音效
export(String) var title = "名稱"
export(String, MULTILINE) var body = "說明文字"
export(AudioStream) var audio
export(String) var focus_marker = ""   # 鏡頭目標名稱（例如 CrossView）
export(String) var link = ""           # 🔗 新增：可點連結

var player : AudioStreamPlayer3D = null

func _ready():
	# 放進「hotspot」群組，點擊邏輯才知道它是熱區
	add_to_group("hotspot")
	# 如果有聲音就建播放器
	if audio:
		player = AudioStreamPlayer3D.new()
		add_child(player)
		player.stream = audio

func get_hotspot_info():
	return {"title": title, "body": body, "link": link}

func play_audio():
	if player:
		player.play()
