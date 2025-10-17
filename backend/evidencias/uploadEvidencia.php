<?php  
require_once __DIR__ . "/../../config/db.php";
header('Content-Type: application/json');

if (!isset($_POST['evaluacion_id']) || empty($_FILES['evidencia']['name'])) {
    echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
    exit;
}

$evaluacion_id = intval($_POST['evaluacion_id']);

// Subida de archivo
$uploadDir = __DIR__ . "/../../uploads/cumplimientos/";

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$filename = time() . "_" . basename($_FILES["evidencia"]["name"]);
$targetFile = $uploadDir . $filename;

if (!move_uploaded_file($_FILES["evidencia"]["tmp_name"], $targetFile)) {
    echo json_encode(['success' => false, 'error' => 'Error al mover el archivo']);
    exit;
}

// ✅ Guardamos solo el nombre en BD
$stmt = $pdo->prepare("INSERT INTO evidencias_cumplimiento (evaluacion_id, archivo, uploaded_at) VALUES (?, ?, NOW())");
$stmt->execute([$evaluacion_id, $filename]);

// Cambiar estado de la evaluación a CUMPLE
$upd = $pdo->prepare("UPDATE evaluaciones SET estado = 'CUMPLE' WHERE id = ?");
$upd->execute([$evaluacion_id]);

echo json_encode([
    'success' => true,
    'file' => $filename, // 👈 solo nombre
    'message' => 'Evidencia subida correctamente'
]);
