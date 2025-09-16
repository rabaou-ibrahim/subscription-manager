<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class UserControllerTest extends WebTestCase
{
    public function testCreateUser(): void
    {
        $client = static::createClient();

        $email = 'testuser+'.uniqid('', true).'@example.com';

        $payload = [
            'firstname' => 'Test',
            'lastname'  => 'User',
            'email'     => $email,
            'password'  => 'testpass123',
        ];

        $client->request(
            'POST',
            '/api/user/create',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload, JSON_THROW_ON_ERROR)
        );

        if ($client->getResponse()->getStatusCode() >= 500) {
            fwrite(STDERR, "\nRESPONSE BODY:\n".$client->getResponse()->getContent(false)."\n");
        }

        self::assertResponseStatusCodeSame(201);
        self::assertJson($client->getResponse()->getContent());
    }
}
