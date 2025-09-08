<?php

namespace App\Tests\Functional\Api;

use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class AuthAndCategoryTest extends WebTestCase
{
    private function json(KernelBrowser $client, string $method, string $uri, array $payload = [], array $headers = []): void
    {
        $client->request(
            $method,
            $uri,
            server: array_merge([
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT'  => 'application/json',
            ], $headers),
            content: json_encode($payload)
        );
    }

    private function bearer(string $token): array
    {
        return ['HTTP_Authorization' => 'Bearer '.$token];
    }

    private function extractId(KernelBrowser $client): ?string
    {
        $response = $client->getResponse();
        $raw = $response->getContent() ?: '{}';
        $json = json_decode($raw, true) ?? [];

        // 1) id direct ou nœuds courants
        $id = $json['id'] ?? ($json['category']['id'] ?? ($json['data']['id'] ?? null));

        // 2) fallback: header Location (201 Created sans corps)
        if (!$id) {
            $loc = $response->headers->get('Location');
            if ($loc) {
                $path = parse_url($loc, PHP_URL_PATH);
                if ($path) {
                    $id = basename($path); // dernier segment de l’URL
                }
            }
        }

        return $id ?: null;
    }

    public function test_can_create_user_and_login_and_get_401_on_protected_route_without_token(): void
    {
        $client = static::createClient();

        // 1) create user (public)
        $this->json($client, 'POST', '/api/user/create', [
            'firstname' => 'Test',
            'lastname'  => 'User',
            'email'     => 'test+'.uniqid().'@example.com',
            'password'  => 'testpass123',
        ]);
        self::assertResponseStatusCodeSame(201);

        // 2) route protégée sans token -> 401/403 attendu
        $client->request('GET', '/api/member/all');
        self::assertTrue(in_array($client->getResponse()->getStatusCode(), [401, 403], true));
    }

    public function test_login_and_create_category_with_token(): void
    {
        $client = static::createClient();

        $email = 'test+'.uniqid().'@example.com';
        $password = 'testpass123';

        // créer user
        $this->json($client, 'POST', '/api/user/create', [
            'firstname' => 'Cat',
            'lastname'  => 'Owner',
            'email'     => $email,
            'password'  => $password,
        ]);
        self::assertResponseStatusCodeSame(201);

        // login -> récup JWT
        $this->json($client, 'POST', '/api/auth/login', [
            'email'    => $email,
            'password' => $password,
        ]);
        self::assertTrue(in_array($client->getResponse()->getStatusCode(), [200, 204], true), 'Login should succeed');
        $data  = json_decode($client->getResponse()->getContent() ?: '{}', true);
        $token = $data['token'] ?? $data['id_token'] ?? $data['jwt'] ?? null;
        self::assertNotEmpty($token, 'JWT token manquant dans la réponse de login');

        // créer category
        $this->json($client, 'POST', '/api/category/create', [
            'name'  => 'Streaming',
            'color' => '#FF8800',
            'type'  => 'expense', // minuscules pour matcher la validation côté API
        ], $this->bearer($token));

        $status = $client->getResponse()->getStatusCode();
        self::assertTrue(in_array($status, [200, 201], true), 'Category creation should return 200/201, got '.$status);

        $categoryId = $this->extractId($client);
        self::assertNotEmpty(
            $categoryId,
            'Category id manquant. Réponse: '.($client->getResponse()->getContent() ?: '(vide)').' | Location: '.($client->getResponse()->headers->get('Location') ?? '(absent)')
        );
    }
}
