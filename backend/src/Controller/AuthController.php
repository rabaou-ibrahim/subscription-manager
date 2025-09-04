<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use App\Repository\UserRepository;
use App\Entity\User;
use Psr\Log\LoggerInterface;
use OpenApi\Annotations as OA;

#[Route('/api/auth')]
/**
 * @OA\Tag(name="Authentication")
 */
class AuthController extends AbstractController
{
    #[Route('/login', name: 'app_login', methods: ['POST'])]
    public function login(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        JWTTokenManagerInterface $jwtManager,
        LoggerInterface $logger
    ): JsonResponse {
        try {
            $payload = json_decode($request->getContent(), true);

            $email = $payload['email'] ?? null;
            $password = $payload['password'] ?? null;

            if (!$email || !$password) {
                return $this->json(['success' => false, 'message' => 'Email et mot de passe requis'], Response::HTTP_BAD_REQUEST);
            }

            $user = $userRepository->findOneBy(['email' => $email]);

            if (!$user instanceof User || !$passwordHasher->isPasswordValid($user, $password)) {
                return $this->json(['success' => false, 'message' => 'Identifiants incorrects'], Response::HTTP_UNAUTHORIZED);
            }

            if (!$user->isActive()) {
                return $this->json(['success' => false, 'message' => 'Compte inactif. Veuillez contacter l\'administrateur.'], Response::HTTP_FORBIDDEN);
            }

            $token = $jwtManager->create($user);

            return $this->json([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => $user->getId(),
                    'firstname' => $user->getFirstname(),
                    'lastname' => $user->getLastname(),
                    'email' => $user->getEmail(),
                    'phone_number' => $user->getPhoneNumber(),
                    'age' => $user->getAge(),
                    'avatar' => $user->getAvatar(),
                    'is_active' => $user->isActive(),
                    'created_at' => $user->getCreatedAt()->format('Y-m-d\TH:i:sP'),
                    'updated_at' => $user->getUpdatedAt()->format('Y-m-d\TH:i:sP')
                ]
            ]);
        } catch (\Exception $e) {
            $logger->error("Erreur de connexion : " . $e->getMessage());
            return $this->json(['success' => false, 'message' => 'Erreur serveur'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
