
extends MeshInstance

export(String, FILE, "*.jpg,*.png") var texture_path = "res://assets/stage.jpg"

func _ready():
	var tex = load(texture_path)
	if tex:
		var mat = SpatialMaterial.new()
		mat.flags_unshaded = true
		mat.params_cull_mode = SpatialMaterial.CULL_DISABLED
		mat.albedo_texture = tex
		material_override = mat
