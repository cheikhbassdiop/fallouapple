<?php
require __DIR__.'/bootstrap.php';
$action=$_GET['action']??'';
if($action==='login' && $_SERVER['REQUEST_METHOD']==='POST'){
  $d=json_input(); $email=strtolower(trim((string)($d['email']??'')));
  $q=$pdo->prepare('SELECT id,name,email,password_hash,role FROM users WHERE email=? AND active=1'); $q->execute([$email]); $u=$q->fetch();
  if(!$u || !password_verify((string)($d['password']??''),$u['password_hash'])){http_response_code(401);echo json_encode(['error'=>'Adresse e-mail ou mot de passe incorrect']);exit;}
  session_regenerate_id(true); unset($u['password_hash']); $_SESSION['user']=$u; echo json_encode(['user'=>$u]); exit;
}
if($action==='logout' && $_SERVER['REQUEST_METHOD']==='POST'){$_SESSION=[];if(ini_get('session.use_cookies')){$p=session_get_cookie_params();setcookie(session_name(),'',time()-42000,$p['path'],$p['domain'],$p['secure'],$p['httponly']);}session_destroy();echo json_encode(['ok'=>true]);exit;}
if($action==='me' && $_SERVER['REQUEST_METHOD']==='GET'){echo json_encode(['user'=>$_SESSION['user']??null]);exit;}
http_response_code(400);echo json_encode(['error'=>'Action inconnue']);
