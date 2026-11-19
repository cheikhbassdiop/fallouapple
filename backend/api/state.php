<?php
require __DIR__ . '/../bootstrap.php';
$user = require_user();
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare('SELECT payload, updated_at FROM app_state WHERE id = 1');
    $stmt->execute();
    $row = $stmt->fetch();
    echo json_encode(['state' => $row ? json_decode($row['payload'], true) : null, 'updated_at' => $row['updated_at'] ?? null]);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (!in_array($user['role'], ['admin', 'manager'], true)) {
        http_response_code(403); echo json_encode(['error' => 'Droits insuffisants pour modifier les données']); exit;
    }
    $data = json_input();
    $state = $data['state'] ?? null;
    if (!is_array($state)) { http_response_code(422); echo json_encode(['error' => 'État de données invalide']); exit; }
    foreach (['produits','commandes','ventes','dettes','historique'] as $key) {
        if (!isset($state[$key]) || !is_array($state[$key])) { http_response_code(422); echo json_encode(['error' => 'Données incomplètes : ' . $key]); exit; }
    }
    $payload = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    $stmt = $pdo->prepare('INSERT INTO app_state (id, payload, updated_by) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP');
    $stmt->execute([$payload, $user['id']]);
    echo json_encode(['ok' => true, 'updated_at' => date('c')]); exit;
}
header('Allow: GET, PUT'); http_response_code(405); echo json_encode(['error' => 'Méthode non autorisée']);
