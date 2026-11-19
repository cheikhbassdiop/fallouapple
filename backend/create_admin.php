<?php
require __DIR__.'/bootstrap.php';
if($_SERVER['REQUEST_METHOD']!=='POST'){header('Allow: POST');http_response_code(405);exit;}
if((int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn()>0){http_response_code(409);echo json_encode(['error'=>'Un compte existe déjà. Supprimez ce script du serveur.']);exit;}
$d=json_input();$name=trim((string)($d['name']??''));$email=strtolower(trim((string)($d['email']??'')));$password=(string)($d['password']??'');
if($name===''||!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($password)<12){http_response_code(422);echo json_encode(['error'=>'Nom, e-mail valide et mot de passe de 12 caractères minimum requis']);exit;}
$q=$pdo->prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'admin')");$q->execute([$name,$email,password_hash($password,PASSWORD_DEFAULT)]);echo json_encode(['created'=>true]);
