<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpFoundation\Response;
use OpenApi\Annotations as OA;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/user')]
/**
 * @OA\Tag(name="User")
 * Contrôleur pour gérer les utilisateurs et administrateurs.
 */
class UserController extends AbstractController
{
    #[Route('/create', name: 'create_user', methods: ['POST'])]
    public function createUser(
        Request $request,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        ValidatorInterface $validator,
        LoggerInterface $logger
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);

            if (empty($data['firstname']) || empty($data['lastname']) || empty($data['email']) || empty($data['password'])) {
                return $this->json(['error' => 'Tous les champs requis doivent être renseignés'], Response::HTTP_BAD_REQUEST);
            }

            if ($entityManager->getRepository(User::class)->findOneBy(['email' => $data['email']])) {
                return $this->json(['error' => 'Cet utilisateur existe déjà'], Response::HTTP_CONFLICT);
            }

            $user = new User();
            $user->setFirstname($data['firstname']);
            $user->setLastname($data['lastname']);
            $user->setEmail($data['email']);
            $user->setPhoneNumber($data['phone_number'] ?? null);
            $user->setAvatar($data['avatar'] ?? 'default.png');
            $user->setIsActive(true);

            $availableRoles = ['ROLE_USER', 'ROLE_ADMIN'];
            $roles = isset($data['roles']) && is_array($data['roles'])
                ? array_intersect($data['roles'], $availableRoles)
                : ['ROLE_USER'];
            $user->setRoles($roles);

            $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
            $user->setPassword($hashedPassword);

            $errors = $validator->validate($user);
            if (count($errors) > 0) {
                $validationErrors = [];
                foreach ($errors as $error) {
                    $validationErrors[$error->getPropertyPath()] = $error->getMessage();
                }
                return $this->json(['errors' => $validationErrors], Response::HTTP_BAD_REQUEST);
            }

            $entityManager->persist($user);
            $entityManager->flush();

            return $this->json([
                'message' => 'Utilisateur créé avec succès',
                'user' => [
                    'id' => $user->getId(),
                    'firstname' => $user->getFirstname(),
                    'lastname' => $user->getLastname(),
                    'email' => $user->getEmail(),
                    'phone_number' => $user->getPhoneNumber(),
                    'avatar' => $user->getAvatar(),
                    'roles' => $user->getRoles(),
                    'is_active' => $user->isActive(),
                    'created_at' => $user->getCreatedAt()?->format('Y-m-d\TH:i:sP'),
                    'updated_at' => $user->getUpdatedAt()?->format('Y-m-d\TH:i:sP')
                ]
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            $logger->error("Erreur lors de la création de l'utilisateur : " . $e->getMessage());
            return $this->json(['error' => 'Erreur serveur'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/all', name: 'get_all_users', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function getAllUsers(EntityManagerInterface $entityManager): JsonResponse
    {
        $users = $entityManager->getRepository(User::class)->findAll();

        $response = array_map(fn($user) => [
            'id' => $user->getId(),
            'firstname' => $user->getFirstname(),
            'lastname' => $user->getLastname(),
            'email' => $user->getEmail(),
            'phone_number' => $user->getPhoneNumber(),
            'avatar' => $user->getAvatar(),
            'is_active' => $user->isActive(),
            'created_at' => $user->getCreatedAt()?->format('Y-m-d\TH:i:sP'),
            'updated_at' => $user->getUpdatedAt()?->format('Y-m-d\TH:i:sP'),
        ], $users);

        return $this->json($response, Response::HTTP_OK);
    }

    #[Route('/me', name: 'api_user_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'id'        => $user->getId(),
            'firstname' => $user->getFirstname(),
            'lastname'  => $user->getLastname(),
            'email'     => $user->getEmail(),
            'roles'     => $user->getRoles(),
        ]);
    }

    #[Route('/{id}', name: 'get_user_by_id', methods: ['GET'], requirements: ['id' => '[0-9a-fA-F-]{36}'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getUserById(string $id, EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $entityManager->getRepository(User::class)->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id' => $user->getId(),
            'firstname' => $user->getFirstname(),
            'lastname' => $user->getLastname(),
            'email' => $user->getEmail(),
            'phone_number' => $user->getPhoneNumber(),
            'avatar' => $user->getAvatar(),
            'is_active' => $user->isActive(),
            'created_at' => $user->getCreatedAt()?->format('Y-m-d\TH:i:sP'),
            'updated_at' => $user->getUpdatedAt()?->format('Y-m-d\TH:i:sP'),
        ]);
    }

    #[Route('/{id}', name: 'update_user', methods: ['PUT'], requirements: ['id' => '[0-9a-fA-F-]{36}'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateUser(
        string $id,
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $user = $entityManager->getRepository(User::class)->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (isset($data['firstname'])) $user->setFirstname($data['firstname']);
        if (isset($data['lastname'])) $user->setLastname($data['lastname']);
        if (isset($data['phone_number'])) $user->setPhoneNumber($data['phone_number']);
        if (isset($data['avatar'])) $user->setAvatar($data['avatar']);
        if (isset($data['password'])) {
            $hashed = $passwordHasher->hashPassword($user, $data['password']);
            $user->setPassword($hashed);
        }

        $errors = $validator->validate($user);
        if (count($errors) > 0) {
            $errs = [];
            foreach ($errors as $error) {
                $errs[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errs], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->flush();
        return $this->json(['message' => 'Utilisateur mis à jour avec succès']);
    }

    #[Route('/delete/{id}', name: 'delete_user', methods: ['DELETE'], requirements: ['id' => '[0-9a-fA-F-]{36}'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deleteUser(string $id, EntityManagerInterface $entityManager, LoggerInterface $logger): JsonResponse
    {
        try {
            $user = $entityManager->getRepository(User::class)->find($id);

            if (!$user) {
                return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
            }

            $currentUser = $this->getUser();

            if (!$currentUser) {
                return $this->json(['error' => 'Utilisateur non authentifié'], Response::HTTP_UNAUTHORIZED);
            }

            if ($currentUser instanceof User && $user->getId() === $currentUser->getId()) {
                return $this->json(['error' => 'Vous ne pouvez pas vous supprimer vous-même'], Response::HTTP_FORBIDDEN);
            }

            $entityManager->remove($user);
            $entityManager->flush();

            return $this->json(['message' => 'Utilisateur supprimé avec succès'], Response::HTTP_OK);
        } catch (\Exception $e) {
            $logger->error("Erreur lors de la suppression de l'utilisateur : " . $e->getMessage());
            return $this->json(['error' => 'Erreur serveur'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id}/promote', name: 'promote_user', methods: ['PATCH'], requirements: ['id' => '[0-9a-fA-F-]{36}'])]
    #[IsGranted('ROLE_ADMIN')]
    public function promoteToAdmin(string $id, EntityManagerInterface $em): JsonResponse
    {
        $user = $em->getRepository(User::class)->find($id);
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $user->setRoles(['ROLE_ADMIN']);
        $em->flush();

        return $this->json([
            'message' => 'Utilisateur promu avec succès',
            'user' => ['id' => $user->getId(), 'email' => $user->getEmail(), 'roles' => $user->getRoles()]
        ]);
    }

    #[Route('/{id}/demote', name: 'demote_user', methods: ['PATCH'], requirements: ['id' => '[0-9a-fA-F-]{36}'])]
    #[IsGranted('ROLE_ADMIN')]
    public function demoteFromAdmin(string $id, EntityManagerInterface $em): JsonResponse
    {
        $user = $em->getRepository(User::class)->find($id);
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $user->setRoles(['ROLE_USER']);
        $em->flush();

        return $this->json([
            'message' => 'Utilisateur rétrogradé avec succès',
            'user' => ['id' => $user->getId(), 'email' => $user->getEmail(), 'roles' => $user->getRoles()]
        ]);
    }
}
