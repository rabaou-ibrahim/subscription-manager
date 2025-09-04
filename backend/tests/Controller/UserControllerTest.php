<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class UserControllerTest extends WebTestCase
{
    public function testCreateUser(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/user/create', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'firstname' => 'Test',
            'lastname' => 'User',
            'email' => 'testuser@example.com',
            'password' => 'testpass123'
        ]));

        $this->assertResponseStatusCodeSame(201);
        $this->assertJson($client->getResponse()->getContent());
    }
}
