<?php

namespace App\Controller;

use App\Entity\Space;
use App\Entity\Invitation;        // ⬅️ add
use App\Entity\Member;                  
use App\Repository\SpaceRepository;
use App\Repository\MemberRepository;         
use App\Repository\InvitationRepository;     
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
    $me    = $this->getUser();
    $email = strtolower($me->getEmail() ?? '');

    // On récupère les espaces où je suis owner, membre OU invité (pending)
    $qb = $em->createQueryBuilder()
        ->select('s', 'cb')
        ->from(Space::class, 's')
        ->leftJoin('s.createdBy', 'cb')
        ->andWhere('cb = :me OR EXISTS (
            SELECT 1 FROM '.Member::class.' mm
            WHERE mm.space = s AND mm.user = :me
        ) OR EXISTS (
            SELECT 1 FROM '.Invitation::class.' inv
            WHERE inv.space = s AND LOWER(inv.email) = :em AND inv.status = :st
        )')
        ->setParameter('me', $me)
        ->setParameter('em', $email)
        ->setParameter('st', Invitation::STATUS_PENDING);

    $spaces = $qb->getQuery()->getResult();

    $data = array_map(function (Space $space) use ($me, $em, $email) {
        $isOwner = $space->getCreatedBy()?->getId() === $me->getId();

        // bool membre ?
        $isMember = (bool)$em->createQueryBuilder()
            ->select('COUNT(mm.id)')
            ->from(Member::class, 'mm')
            ->andWhere('mm.space = :s')->setParameter('s', $space)
            ->andWhere('mm.user = :u')->setParameter('u', $me)
            ->getQuery()->getSingleScalarResult();

        // bool invité pending ?
        $hasInvite = (bool)$em->createQueryBuilder()
            ->select('COUNT(inv.id)')
            ->from(Invitation::class, 'inv')
            ->andWhere('inv.space = :s')->setParameter('s', $space)
            ->andWhere('LOWER(inv.email) = :em')->setParameter('em', $email)
            ->andWhere('inv.status = :st')->setParameter('st', Invitation::STATUS_PENDING)
            ->getQuery()->getSingleScalarResult();

        $role =
            $isOwner ? 'owner' :
            (\in_array('ROLE_ADMIN', $me->getRoles(), true) ? 'admin' :
            ($isMember ? 'member' : ($hasInvite ? 'invited' : 'unknown')));

        return [
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
            ],
            'role'        => $role,
        ];
    }, $spaces);

    return $this->json($data);
}


    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[Route('/{id}', name: 'get_space_by_id', methods: ['GET'])]
    public function getSpaceById(
        string $id,
        SpaceRepository $spaceRepository,
        MemberRepository $memberRepo,
        InvitationRepository $invRepo
    ): JsonResponse {
        $space = $spaceRepository->find($id);
        if (!$space) {
            return $this->json(['error' => 'Espace non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $me    = $this->getUser();
        $email = strtolower($me->getEmail() ?? '');

        $isOwner  = $space->getCreatedBy()?->getId() === $me->getId();
        $isAdmin  = \in_array('ROLE_ADMIN', $me->getRoles(), true);

        $isMember = (bool)$memberRepo->createQueryBuilder('m')
            ->select('COUNT(m.id)')
            ->andWhere('m.space = :s')->setParameter('s', $space)
            ->andWhere('m.user  = :u')->setParameter('u', $me)
            ->getQuery()->getSingleScalarResult();

        $hasInvite = (bool)$invRepo->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->andWhere('i.space = :s')->setParameter('s', $space)
            ->andWhere('LOWER(i.email) = :em')->setParameter('em', $email)
            ->andWhere('i.status = :st')->setParameter('st', Invitation::STATUS_PENDING)
            ->getQuery()->getSingleScalarResult();

        if (!($isOwner || $isAdmin || $isMember || $hasInvite)) {
            // L’espace existe, mais l’utilisateur n’a aucun lien → 403
            return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
        }

        $role =
            $isOwner ? 'owner' :
            ($isAdmin ? 'admin' :
            ($isMember ? 'member' : 'invited'));

        $permissions = [
            'canManage'             => $isOwner || $isAdmin,            // modifier espace, gérer membres & invitations
            'canViewMembers'        => $isOwner || $isAdmin,            // voir la liste des membres
            'canInvite'             => $isOwner || $isAdmin,
            'canCreateSubscription' => $isOwner || $isAdmin || $isMember,
        ];

        return $this->json([
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
            ],
            'role'        => $role,
            'permissions' => $permissions,
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
