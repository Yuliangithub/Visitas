<?php
require_once __DIR__ . "/../../config/db.php";
header('Content-Type: application/json');

if (!isset($_POST['evaluacion_id']) || empty($_FILES['evidencia']['name'])) {
    echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
    exit;
}

$evaluacion_id = intval($_POST['evaluacion_id']);

// Subir archivo a carpeta uploads fuera de backend
$uploadDir = __DIR__ . "/../../uploads/hallazgos/";

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$filename = time() . "_" . basename($_FILES["evidencia"]["name"]);
$targetFile = $uploadDir . $filename;

if (!move_uploaded_file($_FILES["evidencia"]["tmp_name"], $targetFile)) {
    echo json_encode(['success' => false, 'error' => 'Error al mover el archivo']);
    exit;
}

// Guardar en la columna de evidencia de la evaluación
$stmt = $pdo->prepare("UPDATE evaluaciones SET evidencia = ? WHERE id = ?");
$stmt->execute([$filename, $evaluacion_id]);

echo json_encode([
    'success' => true,
    'file' => $filename  // solo nombre, sin ruta
]);
