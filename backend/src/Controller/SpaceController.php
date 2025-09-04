<?php

namespace App\Controller;

use App\Entity\Space;
use App\Repository\SpaceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use OpenApi\Annotations as OA;

#[Route('/api/space')]
/**
 * @OA\Tag(name="Space")
 */
class SpaceController extends AbstractController
{
    /**
     * @OA\Post(
     *     path="/api/space/create",
     *     summary="Créer un nouvel espace",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "visibility"},
     *             @OA\Property(property="name", type="string", example="Espace Famille"),
     *             @OA\Property(property="visibility", type="string", example="private"),
     *             @OA\Property(property="description", type="string", example="Un espace privé"),
     *             @OA\Property(property="logo", type="string", example="logo.png")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Espace créé"),
     *     @OA\Response(response=400, description="Requête invalide")
     * )
     */
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
#[Route('/create', name: 'create_space', methods: ['POST'])]
public function createSpace(
    Request $request,
    EntityManagerInterface $em,
    ValidatorInterface $validator
): JsonResponse {
    $data = json_decode($request->getContent(), true);

    if (empty($data['name']) || empty($data['visibility'])) {
        return $this->json(['error' => 'Le nom et la visibilité sont requis'], 400);
    }

    $name = trim($data['name']);

    // 🔒 Garde-fou anti-doublon (par utilisateur, insensible à la casse)
    $existing = $em->getRepository(\App\Entity\Space::class)
        ->createQueryBuilder('s')
        ->andWhere('s.createdBy = :u')
        ->andWhere('LOWER(s.name) = LOWER(:n)')
        // ❗️ Remplacer setParameters([...]) par deux setParameter()
        ->setParameter('u', $this->getUser())
        ->setParameter('n', $name)
        ->setMaxResults(1)
        ->getQuery()
        ->getOneOrNullResult();

    if ($existing) {
        return $this->json([
            'error' => sprintf('Vous avez déjà un espace nommé “%s”.', $name)
        ], 409); // 409 Conflict
    }

    $space = new \App\Entity\Space();
    $space->setName($name);
    $space->setVisibility($data['visibility']);
    $space->setDescription($data['description'] ?? null);
    $space->setLogo($data['logo'] ?? 'default.png');
    $space->setCreatedBy($this->getUser());

    $errors = $validator->validate($space);
    if (count($errors) > 0) {
        return $this->json(['error' => (string) $errors], 400);
    }

    $em->persist($space);
    $em->flush();

    return $this->json([
        'message' => 'Espace créé avec succès',
        'space' => [
            'id' => $space->getId(),
            'name' => $space->getName(),
            'visibility' => $space->getVisibility(),
            'description' => $space->getDescription(),
            'logo' => $space->getLogo(),
            'created_at' => $space->getCreatedAt()?->format('Y-m-d\TH:i:sP'),
            'created_by' => [
                'id' => $space->getCreatedBy()?->getId(),
                'email' => $space->getCreatedBy()?->getEmail(),
                'full_name' => $space->getCreatedBy()?->getFullName(),
            ],
        ],
    ], 201);
}


    #[Route('/all', name: 'get_all_spaces', methods: ['GET'])]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
public function getAllSpaces(EntityManagerInterface $em): JsonResponse
{
    $me = $this->getUser();

    $qb = $em->getRepository(Space::class)->createQueryBuilder('s')
        ->leftJoin('s.createdBy', 'cb')->addSelect('cb')
        ->leftJoin('s.members', 'm')->addSelect('m')
        ->leftJoin('m.user', 'mu')->addSelect('mu');

    if (!$this->isGranted('ROLE_ADMIN')) {
        $qb->andWhere('cb = :me OR mu = :me')->setParameter('me', $me);
    }

    $spaces = $qb->getQuery()->getResult();

    $data = array_map(fn(Space $space) => [
        'id'          => $space->getId(),
        'name'        => $space->getName(),
        'visibility'  => $space->getVisibility(),
        'description' => $space->getDescription(),
        'logo'        => $space->getLogo(),
        'created_at'  => $space->getCreatedAt()?->format('Y-m-d\TH:i:sP'),
        'created_by'  => [
            'id'        => $space->getCreatedBy()?->getId(),
            'email'     => $space->getCreatedBy()?->getEmail(),
            'full_name' => $space->getCreatedBy()?->getFullName(),
        ]
    ], $spaces);

    return $this->json($data);
}


    /**
     * @OA\Get(path="/api/space/{id}", summary="Récupérer un espace par son ID")
     */
    #[Route('/{id}', name: 'get_space_by_id', methods: ['GET'])]
    public function getSpaceById(string $id, SpaceRepository $spaceRepository): JsonResponse
    {
        $space = $spaceRepository->find($id);
        if (!$space) {
            return $this->json(['error' => 'Espace non trouvé'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id' => $space->getId(),
            'name' => $space->getName(),
            'visibility' => $space->getVisibility(),
            'description' => $space->getDescription(),
            'logo' => $space->getLogo(),
            'created_at' => $space->getCreatedAt()?->format('Y-m-d\TH:i:sP'),
            'created_by' => [
                'id' => $space->getCreatedBy()?->getId(),
                'email' => $space->getCreatedBy()?->getEmail(),
                'full_name' => $space->getCreatedBy()?->getFullName()
            ]
        ]);
    }

    /**
     * @OA\Patch(path="/api/space/archive/{id}", summary="Archiver un espace")
     */
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[Route('/archive/{id}', name: 'archive_space', methods: ['PATCH'])]
    public function archiveSpace(string $id, EntityManagerInterface $entityManager, SpaceRepository $spaceRepository): JsonResponse
    {
        $space = $spaceRepository->find($id);
        if (!$space) {
            return $this->json(['error' => 'Espace non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $space->archiveSpace();
        $entityManager->flush();

        return $this->json(['message' => 'Espace archivé avec succès']);
    }

    /**
     * @OA\Delete(path="/api/space/delete/{id}", summary="Supprimer un espace")
     */
    #[IsGranted('ROLE_ADMIN')]
    #[Route('/delete/{id}', name: 'delete_space', methods: ['DELETE'])]
    public function deleteSpace(string $id, EntityManagerInterface $entityManager, SpaceRepository $spaceRepository): JsonResponse
    {
        $space = $spaceRepository->find($id);
        if (!$space) {
            return $this->json(['error' => 'Espace non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $entityManager->remove($space);
        $entityManager->flush();

        return $this->json(['message' => 'Espace supprimé avec succès']);
    }
}
