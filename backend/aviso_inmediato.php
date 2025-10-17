<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require __DIR__ . "/../config/db.php";   // conexión PDO
require __DIR__ . "/../vendor/autoload.php"; // PHPMailer

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ✅ Función para enviar correo
function enviarCorreo($destino, $asunto, $mensaje) {
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'yulianserrano2004@gmail.com'; // 🔹 cámbialo
        $mail->Password   = 'kybn wyhf algs wfnf'; // 🔹 cámbialo
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        $mail->setFrom('yulianserrano2004@gmail.com', 'Sistema de Cumplimientos');
        $mail->addAddress($destino);

        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body    = $mensaje;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("❌ Error al enviar correo inmediato: {$mail->ErrorInfo}");
        return false;
    }
}

// ✅ Buscar la última evaluación recién creada en estado NO CUMPLE
$sql = "SELECT e.id, e.actividad, e.plazo, r.nombre, r.correo
        FROM evaluaciones e
        JOIN responsables r ON e.responsable = r.id
        WHERE e.estado = 'NO CUMPLE'
        ORDER BY e.created_at DESC
        LIMIT 1";

$stmt = $pdo->query($sql);
$eval = $stmt->fetch(PDO::FETCH_ASSOC);

if ($eval) {
    $mensaje = "
        <p>Hola <b>{$eval['nombre']}</b>,</p>
        <p>Se te ha asignado un <b>nuevo aspecto encontrado</b> en la evaluación.</p>
        <p><b>Actividad:</b> {$eval['actividad']}</p>
        <p><b>Plazo límite:</b> {$eval['plazo']}</p>
        <p>Por favor revisa el sistema y gestiona el cumplimiento.</p>
        <p><i>Este es un aviso automático generado al crear la evaluación.</i></p>
    ";

    if (enviarCorreo($eval['correo'], "Nuevo aspecto encontrado", $mensaje)) {
        echo "✅ Correo inmediato enviado a {$eval['correo']}";
    } else {
        echo "❌ Error al enviar correo inmediato";
    }
} else {
    echo "ℹ️ No se encontró ninguna evaluación nueva en estado NO CUMPLE";
}
