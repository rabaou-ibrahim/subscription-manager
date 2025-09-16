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
    #[Route('/create', name: 'api_user_create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher,
        ValidatorInterface $validator
    ): JsonResponse {
        // 1) Parse JSON
        $data = json_decode($request->getContent() ?: '[]', true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Payload JSON invalide'], 400);
        }

        // 2) Normalisation / valeurs
        $firstname = trim((string)($data['firstname'] ?? ''));
        $lastname  = trim((string)($data['lastname'] ?? ''));
        $email     = strtolower(trim((string)($data['email'] ?? '')));
        $plain     = (string)($data['password'] ?? '');

        $username  = isset($data['username']) && $data['username'] !== '' ? trim((string)$data['username']) : null;
        $phone     = isset($data['phone_number']) && $data['phone_number'] !== '' ? trim((string)$data['phone_number']) : null;
        $age       = array_key_exists('age', $data) && $data['age'] !== null && $data['age'] !== ''
            ? (int)$data['age']
            : null;
        $avatar    = isset($data['avatar']) && $data['avatar'] !== '' ? trim((string)$data['avatar']) : null;

        $roles     = (isset($data['roles']) && is_array($data['roles']) && count($data['roles']) > 0)
            ? array_values(array_unique($data['roles']))
            : ['ROLE_USER'];

        $isActive  = array_key_exists('is_active', $data) ? (bool)$data['is_active'] : true;

        // Règle métier explicite (en plus de l’Assert\Expression)
        if ($username !== null && strcasecmp($username, $email) === 0) {
            return $this->json(['error' => "L'email et le pseudo doivent être différents."], 422);
        }

        // 3) Hydrate l’entité
        $user = (new User())
            ->setFirstname($firstname)
            ->setLastname($lastname)
            ->setEmail($email)
            ->setUsername($username)
            ->setPhoneNumber($phone)
            ->setAge($age)
            ->setAvatar($avatar)
            ->setRoles($roles)
            ->setIsActive($isActive);

        // 4) Hash du mot de passe (obligatoire)
        $hash = $hasher->hashPassword($user, $plain);
        $user->setPassword($hash);

        // 5) Validation Symfony (annotations de l’entité)
        $violations = $validator->validate($user);
        if (count($violations) > 0) {
            $errs = [];
            /** @var ConstraintViolationInterface $v */
            foreach ($violations as $v) {
                $prop = $v->getPropertyPath() ?: 'global';
                $errs[$prop][] = $v->getMessage();
            }
            return $this->json(['errors' => $errs], 422);
        }

        try {
            $em->persist($user);
            $em->flush();
        } catch (UniqueConstraintViolationException $e) {
            $msg = 'Email ou pseudo déjà utilisé.';
            $txt = strtolower($e->getMessage());
            if (str_contains($txt, 'email')) {
                $msg = 'Cet email est déjà utilisé.';
            } elseif (str_contains($txt, 'username')) {
                $msg = 'Ce pseudo est déjà pris.';
            }
            return $this->json(['error' => $msg], 409);
        } catch (\Throwable $e) {
            return $this->json(['error' => 'Erreur serveur'], 500);
        }

        return $this->json([
            'id'          => $user->getId(),
            'firstname'   => $user->getFirstname(),
            'lastname'    => $user->getLastname(),
            'email'       => $user->getEmail(),
            'username'    => $user->getUsername(),
            'avatar'      => $user->getAvatar(),
            'phone_number'=> $user->getPhoneNumber(),
            'age'         => $user->getAge(),
            'roles'       => $user->getRoles(),
            'is_active'   => $user->isActive(),
            'created_at'  => $user->getCreatedAt()?->format(\DATE_ATOM),
        ], 201);
    }
    /**
     * @OA\Get(
     *     path="/api/user/all",
     *     summary="Liste de tous les utilisateurs",
     *     security={{"bearerAuth": {}}},
     *     @OA\Response(response=200, description="Liste retournée avec succès"),
     *     @OA\Response(response=403, description="Accès interdit")
     * )
    */
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
            'id'           => $user->getId(),
            'firstname'    => $user->getFirstname(),
            'lastname'     => $user->getLastname(),
            'email'        => $user->getEmail(),
            'username'     => $user->getUsername(),
            'avatar'       => $user->getAvatar(),
            'phone_number' => $user->getPhoneNumber(),
            'age'          => $user->getAge(),
            'roles'        => $user->getRoles(),
            'is_active'    => $user->isActive(),
            'created_at'   => $user->getCreatedAt()?->format('c'),
            'updated_at'   => $user->getUpdatedAt()?->format('c'),
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
