<?php

namespace App\Controller;

use App\Entity\Category;
use App\Repository\CategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpFoundation\Response;
use OpenApi\Annotations as OA;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/category')]
/**
 * @OA\Tag(name="Category")
 * Contrôleur pour gérer les catégories.
 */
class CategoryController extends AbstractController
{
    /**
     * @OA\Post(
     *     path="/api/category/create",
     *     summary="Créer une nouvelle catégorie",
     *     description="Ajoute une nouvelle catégorie pour classer les services et abonnements.",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "type", "color"},
     *             @OA\Property(property="name", type="string", example="Divertissement"),
     *             @OA\Property(property="description", type="string", example="Catégorie pour les abonnements de divertissement"),
     *             @OA\Property(property="color", type="string", example="#FF5733"),
     *             @OA\Property(property="icon", type="string", example="fa-movie"),
     *             @OA\Property(property="type", type="string", example="expense"),
     *             @OA\Property(property="is_default", type="boolean", example=false)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Catégorie créée avec succès"),
     *     @OA\Response(response=400, description="Données invalides")
     * )
     */
    #[Route('/create', name: 'create_category', methods: ['POST'])]
    public function createCategory(
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['name'], $data['type'], $data['color'])) {
            return $this->json(['error' => 'Tous les champs requis doivent être renseignés'], Response::HTTP_BAD_REQUEST);
        }

        $category = new Category();
        $category->setName($data['name']);
        $category->setDescription($data['description'] ?? null);
        $category->setColor($data['color']);
        $category->setIcon($data['icon'] ?? null);
        $category->setType($data['type']);
        $category->setIsDefault($data['is_default'] ?? false);

        $errors = $validator->validate($category);
        if (count($errors) > 0) {
            return $this->json(['error' => (string) $errors], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($category);
        $entityManager->flush();

        return $this->json([
            'message' => 'Catégorie créée avec succès',
            'category' => [
                'id' => $category->getId(),
                'name' => $category->getName(),
                'description' => $category->getDescription(),
                'color' => $category->getColor(),
                'icon' => $category->getIcon(),
                'type' => $category->getType(),
                'is_default' => $category->isDefault()
            ]
        ], Response::HTTP_CREATED);
    }

    /**
     * @OA\Get(path="/api/category/all", summary="Récupérer toutes les catégories")
     */
    #[Route('/all', name: 'get_all_categories', methods: ['GET'])]
    public function getAllCategories(CategoryRepository $categoryRepository): JsonResponse
    {
        $categories = $categoryRepository->findAll();

        $response = array_map(fn($category) => [
            'id' => $category->getId(),
            'name' => $category->getName(),
            'description' => $category->getDescription(),
            'color' => $category->getColor(),
            'icon' => $category->getIcon(),
            'type' => $category->getType(),
            'is_default' => $category->isDefault()
        ], $categories);

        return $this->json($response, Response::HTTP_OK);
    }

    /**
     * @OA\Get(path="/api/category/{id}", summary="Récupérer une catégorie par ID")
     */
    #[Route('/{id}', name: 'get_category_by_id', methods: ['GET'])]
    public function getCategoryById(string $id, CategoryRepository $categoryRepository): JsonResponse
    {
        $category = $categoryRepository->find($id);
        if (!$category) {
            return $this->json(['error' => 'Catégorie non trouvée'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id' => $category->getId(),
            'name' => $category->getName(),
            'description' => $category->getDescription(),
            'color' => $category->getColor(),
            'icon' => $category->getIcon(),
            'type' => $category->getType(),
            'is_default' => $category->isDefault()
        ]);
    }

    /**
     * @OA\Put(path="/api/category/update/{id}", summary="Mettre à jour une catégorie")
     */
    #[Route('/update/{id}', name: 'update_category', methods: ['PUT'])]
    public function updateCategory(
        string $id,
        Request $request,
        EntityManagerInterface $entityManager,
        CategoryRepository $categoryRepository
    ): JsonResponse {
        $category = $categoryRepository->find($id);
        if (!$category) {
            return $this->json(['error' => 'Catégorie non trouvée'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        $category->setName($data['name'] ?? $category->getName());
        $category->setDescription($data['description'] ?? $category->getDescription());
        $category->setColor($data['color'] ?? $category->getColor());
        $category->setIcon($data['icon'] ?? $category->getIcon());
        $category->setType($data['type'] ?? $category->getType());
        $category->setIsDefault($data['is_default'] ?? $category->isDefault());

        $entityManager->flush();

        return $this->json(['message' => 'Catégorie mise à jour avec succès'], Response::HTTP_OK);
    }

    /**
     * @OA\Delete(path="/api/category/delete/{id}", summary="Supprimer une catégorie")
     */
    #[Route('/delete/{id}', name: 'delete_category', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deleteCategory(string $id, EntityManagerInterface $entityManager, CategoryRepository $categoryRepository): JsonResponse
    {
        $category = $categoryRepository->find($id);
        if (!$category) {
            return $this->json(['error' => 'Catégorie non trouvée'], Response::HTTP_NOT_FOUND);
        }

        $entityManager->remove($category);
        $entityManager->flush();

        return $this->json(['message' => 'Catégorie supprimée avec succès'], Response::HTTP_OK);
    }
}
