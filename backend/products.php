<?php
require __DIR__.'/bootstrap.php';
$method=$_SERVER['REQUEST_METHOD'];
if($method==='GET'){require_user();echo json_encode($pdo->query('SELECT id,name,category,sale_price,cost_price,stock,image FROM products ORDER BY name')->fetchAll());exit;}
if($method==='POST'){require_role(['admin','manager']);$d=json_input();$name=trim($d['name']??'');$qty=filter_var($d['stock']??null,FILTER_VALIDATE_INT);$price=filter_var($d['sale_price']??null,FILTER_VALIDATE_INT);$cost=filter_var($d['cost_price']??0,FILTER_VALIDATE_INT);if($name===''||$qty===false||$qty<0||$price===false||$price<0||$cost===false||$cost<0){http_response_code(422);echo json_encode(['error'=>'Données produit invalides']);exit;}$q=$pdo->prepare('INSERT INTO products(name,category,sale_price,cost_price,stock,image) VALUES(?,?,?,?,?,?)');$q->execute([$name,$d['category']??'', $price,$cost,$qty,$d['image']??null]);echo json_encode(['id'=>(int)$pdo->lastInsertId()]);exit;}
http_response_code(405);echo json_encode(['error'=>'Méthode non autorisée']);
