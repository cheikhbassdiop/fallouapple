<?php
declare(strict_types=1);
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) { http_response_code(503); header('Content-Type: application/json; charset=utf-8'); echo json_encode(['error'=>'Configurez backend/config.php à partir de config.example.php']); exit; }
$config = require $configFile;
session_name($config['session_name'] ?? 'FALOUAPPLESESSID');
session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>(bool)($config['cookie_secure'] ?? true),'httponly'=>true,'samesite'=>'Lax']);
session_start();
header('Content-Type: application/json; charset=utf-8'); header('X-Content-Type-Options: nosniff'); header('Cache-Control: no-store');
try {
  $pdo = new PDO('mysql:host='.$config['db_host'].';dbname='.$config['db_name'].';charset=utf8mb4', $config['db_user'], $config['db_pass'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES=>false]);
} catch (Throwable $e) { http_response_code(500); echo json_encode(['error'=>'Connexion à la base de données impossible']); exit; }
function json_input(): array { $v=json_decode(file_get_contents('php://input'), true); return is_array($v)?$v:[]; }
function require_user(): array { if (empty($_SESSION['user'])) { http_response_code(401); echo json_encode(['error'=>'Authentification requise']); exit; } return $_SESSION['user']; }
function require_role(array $roles): array { $u=require_user(); if (!in_array($u['role'],$roles,true)) { http_response_code(403); echo json_encode(['error'=>'Droits insuffisants']); exit; } return $u; }
