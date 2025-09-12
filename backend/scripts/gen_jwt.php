<?php
$pass = $argv[1] ?? 'just_another_passphrase';
$r = openssl_pkey_new(['private_key_bits'=>4096,'private_key_type'=>OPENSSL_KEYTYPE_RSA]) or die("OpenSSL error\n");
openssl_pkey_export($r, $priv, $pass);
$pub = openssl_pkey_get_details($r)['key'];
@mkdir(__DIR__.'/../config/jwt', 0777, true);
file_put_contents(__DIR__.'/../config/jwt/private.pem', $priv);
file_put_contents(__DIR__.'/../config/jwt/public.pem',  $pub);
echo "OK\n";
