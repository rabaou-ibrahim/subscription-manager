<?php

namespace App\Controller;

use App\Entity\Tag;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpFoundation\Response;
use OpenApi\Annotations as OA;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/tag')]
/**
 * @OA\Tag(name="Tag")
 */
class TagController extends AbstractController
{
    /**
     * @OA\Post(
     *     path="/api/tag/create",
     *     summary="Créer un nouveau tag",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "color"},
     *             @OA\Property(property="name", type="string", example="Important"),
     *             @OA\Property(property="description", type="string", example="Tag pour les éléments importants"),
     *             @OA\Property(property="color", type="string", example="#FF5733")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Tag créé avec succès"),
     *     @OA\Response(response=400, description="Données invalides")
     * )
     */
    #[Route('/create', name: 'create_tag', methods: ['POST'])]
    public function createTag(
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['name'], $data['color'])) {
            return $this->json(['error' => 'Le nom et la couleur sont obligatoires'], Response::HTTP_BAD_REQUEST);
        }

        $tag = new Tag();
        $tag->setName($data['name']);
        $tag->setDescription($data['description'] ?? null);
        $tag->setColor($data['color']);

        $errors = $validator->validate($tag);
        if (count($errors) > 0) {
            return $this->json(['error' => (string) $errors], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($tag);
        $entityManager->flush();

        return $this->json([
            'message' => 'Tag créé avec succès',
            'tag' => [
                'id' => $tag->getId(),
                'name' => $tag->getName(),
                'description' => $tag->getDescription(),
                'color' => $tag->getColor(),
            ]
        ], Response::HTTP_CREATED);
    }

    /**
     * @OA\Get(path="/api/tag/all", summary="Récupérer tous les tags")
     */
    #[Route('/all', name: 'get_all_tags', methods: ['GET'])]
    public function getAllTags(EntityManagerInterface $entityManager): JsonResponse
    {
        $tags = $entityManager->getRepository(Tag::class)->findAll();

        $response = array_map(fn($tag) => [
            'id' => $tag->getId(),
            'name' => $tag->getName(),
            'description' => $tag->getDescription(),
            'color' => $tag->getColor()
        ], $tags);

        return $this->json($response, Response::HTTP_OK);
    }

    /**
     * @OA\Delete(path="/api/tag/delete/{id}", summary="Supprimer un tag")
     */
    #[Route('/delete/{id}', name: 'delete_tag', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deleteTag(string $id, EntityManagerInterface $entityManager): JsonResponse
    {
        $tag = $entityManager->getRepository(Tag::class)->find($id);
        if (!$tag) {
            return $this->json(['error' => 'Tag non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $entityManager->remove($tag);
        $entityManager->flush();

        return $this->json(['message' => 'Tag supprimé avec succès'], Response::HTTP_OK);
    }
}
