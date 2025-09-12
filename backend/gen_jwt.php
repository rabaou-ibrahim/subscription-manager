<?php
$pass = 'just_another_passphrase';
$r = openssl_pkey_new(['private_key_bits'=>4096,'private_key_type'=>OPENSSL_KEYTYPE_RSA]);
if (!$r) { while ($e = openssl_error_string()) fwrite(STDERR, $e.PHP_EOL); exit(1); }
openssl_pkey_export($r, $priv, $pass);
$pub = openssl_pkey_get_details($r)['key'];
file_put_contents(__DIR__.'/config/jwt/private.pem', $priv);
file_put_contents(__DIR__.'/config/jwt/public.pem',  $pub);
echo "OK\n";
