<?php

namespace App\Controller;

use App\Entity\Permission;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use OpenApi\Annotations as OA;

#[Route('/api/permission')]
/**
 * @OA\Tag(name="Permission")
 */
class PermissionController extends AbstractController
{
    /**
     * @OA\Post(
     *     path="/api/permission/assign",
     *     summary="Assigner une permission à un utilisateur",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"user_id", "permission_type"},
     *             @OA\Property(property="user_id", type="string", example="c7a29b40-d5fc-11ed-afa1-0242ac120002"),
     *             @OA\Property(property="permission_type", type="string", example="ROLE_ADMIN")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Permission assignée avec succès"),
     *     @OA\Response(response=400, description="Données invalides"),
     *     @OA\Response(response=404, description="Utilisateur non trouvé")
     * )
     */
    #[Route('/assign', name: 'assign_permission', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function assignPermission(
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        LoggerInterface $logger
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);

            if (!isset($data['user_id'], $data['permission_type'])) {
                return $this->json(['error' => 'Tous les champs requis doivent être renseignés'], Response::HTTP_BAD_REQUEST);
            }

            $user = $entityManager->getRepository(User::class)->find($data['user_id']);

            if (!$user) {
                return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
            }

            if (!in_array($data['permission_type'], Permission::ROLES_AVAILABLE, true)) {
                return $this->json(['error' => 'Type de permission invalide'], Response::HTTP_BAD_REQUEST);
            }

            $permission = new Permission();
            $permission->setUser($user);
            $permission->setPermissionType($data['permission_type']);

            $errors = $validator->validate($permission);
            if (count($errors) > 0) {
                return $this->json(['error' => (string) $errors], Response::HTTP_BAD_REQUEST);
            }

            $entityManager->persist($permission);
            $entityManager->flush();

            return $this->json(['message' => 'Permission assignée avec succès'], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            $logger->error("Erreur d'assignation de permission : " . $e->getMessage());
            return $this->json(['error' => 'Erreur serveur'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/permission/user/{id}",
     *     summary="Récupérer les permissions d’un utilisateur",
     *     @OA\Response(response=200, description="Liste des permissions"),
     *     @OA\Response(response=404, description="Utilisateur non trouvé")
     * )
     */
    #[Route('/user/{id}', name: 'get_user_permissions', methods: ['GET'])]
    public function getUserPermissions(string $id, EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $entityManager->getRepository(User::class)->find($id);
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $permissions = $entityManager->getRepository(Permission::class)->findBy(['user' => $user]);

        $response = array_map(fn($perm) => $perm->getPermissionType(), $permissions);

        return $this->json(['permissions' => $response], Response::HTTP_OK);
    }

    /**
     * @OA\Delete(
     *     path="/api/permission/revoke/{id}",
     *     summary="Révoquer une permission",
     *     @OA\Response(response=200, description="Permission révoquée"),
     *     @OA\Response(response=404, description="Permission non trouvée")
     * )
     */
    #[Route('/revoke/{id}', name: 'revoke_permission', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function revokePermission(
        string $id,
        EntityManagerInterface $entityManager,
        LoggerInterface $logger
    ): JsonResponse {
        try {
            $permission = $entityManager->getRepository(Permission::class)->find($id);
            if (!$permission) {
                return $this->json(['error' => 'Permission non trouvée'], Response::HTTP_NOT_FOUND);
            }

            $entityManager->remove($permission);
            $entityManager->flush();

            return $this->json(['message' => 'Permission révoquée avec succès'], Response::HTTP_OK);
        } catch (\Exception $e) {
            $logger->error("Erreur lors de la suppression de la permission : " . $e->getMessage());
            return $this->json(['error' => 'Erreur serveur'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
