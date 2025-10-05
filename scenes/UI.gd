extends CanvasLayer

onready var r = $Panel/Body

func _ready():
	r.bbcode_enabled = true
	r.bbcode_text = "[url=https://example.com]點我開網頁[/url]"
	r.connect("meta_clicked", self, "_on_meta_clicked")

func _on_meta_clicked(meta):
	var url = str(meta)
	if OS.get_name() == "HTML5":
		JavaScript.eval("window.open('%s','_blank');" % url, true)
	else:
		OS.shell_open(url)
