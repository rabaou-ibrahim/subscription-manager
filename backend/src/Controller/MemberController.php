<?php

namespace App\Controller;

use App\Entity\Invitation;
use App\Entity\Member;
use App\Entity\Space;
use App\Repository\InvitationRepository;
use App\Repository\MemberRepository;
use App\Repository\SpaceRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Annotations as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/member')]
/**
 * @OA\Tag(name="Member")
 */
class MemberController extends AbstractController
{
    #[Route('/create', name: 'create_member', methods: ['POST'])]
    public function create(
        Request $req,
        SpaceRepository $spaces,
        UserRepository $users,
        MemberRepository $members,
        InvitationRepository $invRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $payload      = json_decode($req->getContent(), true) ?: [];
        $spaceUuid    = (string)($payload['space_id'] ?? '');
        $relationship = (string)($payload['relationship'] ?? 'friend');
        $dobStr       = $payload['date_of_birth'] ?? null;
        $userId       = $payload['user_id'] ?? null;   // string/uuid/int selon ton User
        $email        = $payload['email'] ?? null;

        if ($spaceUuid === '' || $relationship === '') {
            return $this->json(['error' => 'space_id et relationship requis'], 400);
        }

        // PK = UUID
        $space = $spaces->find($spaceUuid);
        if (!$space) return $this->json(['error' => 'Espace introuvable'], 404);

        $me = $this->getUser();
        $isOwner = $space->getCreatedBy() && $space->getCreatedBy()->getId() === $me->getId();
        $isAdmin = \in_array('ROLE_ADMIN', $me->getRoles(), true);
        if (!$isOwner && !$isAdmin) return $this->json(['error' => 'Accès refusé'], 403);

        $dob = null;
        if ($dobStr) { try { $dob = new \DateTimeImmutable($dobStr); } catch (\Throwable $e) {} }

        // 1) Attacher un user existant (par id ou email)
        $user = null;
        if ($userId) {
            $user = $users->find($userId); // surtout pas de (int) ici
        } elseif ($email) {
            $user = $users->findOneBy(['email' => strtolower(trim($email))]);
        }

        if ($user) {
    // éviter doublon
    $already = $members->findOneBy(['space' => $space, 'user' => $user]);
    if ($already) {
        return $this->json([
            'status' => 'added',
            'member' => [
                'id' => $already->getId(),
                'name' => (method_exists($user, 'getName') && $user->getName()) ? $user->getName() : $user->getEmail(),
                'relationship' => $already->getRelationship(),
                'date_of_birth' => $already->getDateOfBirth()?->format('Y-m-d'),
                'user_id' => $user->getId(),
            ]
        ]);
    }

    // === NEW: déterminer un nom d’affichage non-null ===
    $displayName = trim((string)($payload['name'] ?? ''));
    if ($displayName === '') {
        if (method_exists($user, 'getName') && $user->getName()) {
            $displayName = $user->getName();
        } elseif (
            (method_exists($user, 'getFirstname') && $user->getFirstname()) ||
            (method_exists($user, 'getLastname') && $user->getLastname())
        ) {
            $fn = method_exists($user, 'getFirstname') ? ($user->getFirstname() ?? '') : '';
            $ln = method_exists($user, 'getLastname')  ? ($user->getLastname()  ?? '') : '';
            $displayName = trim($fn.' '.$ln);
        } elseif (method_exists($user, 'getEmail')) {
            $displayName = $user->getEmail();
        } else {
            $displayName = 'Membre';
        }
    }

    $m = new Member();
    $m->setSpace($space);
    $m->setUser($user);
    $m->setName($displayName);                  // 👈 OBLIGATOIRE pour NOT NULL
    $m->setRelationship($relationship);
    $m->setDateOfBirth($dob);
    $em->persist($m);
    $em->flush();

    return $this->json([
        'status' => 'added',
        'member' => [
            'id' => $m->getId(),
            'name' => $m->getName(),
            'relationship' => $m->getRelationship(),
            'date_of_birth' => $m->getDateOfBirth()?->format('Y-m-d'),
            'user_id' => $user->getId(),
        ]
    ]);
}


        // 2) Sinon : créer/retourner une invitation
        if (!$email) return $this->json(['error' => 'email requis pour invitation'], 400);
        $email = strtolower(trim($email));

        // si l'email s'est enregistré entre-temps
        if ($existingUser = $users->findOneBy(['email' => $email])) {
    // === NEW: déterminer un nom d’affichage non-null ===
    $displayName = trim((string)($payload['name'] ?? ''));
    if ($displayName === '') {
        if (method_exists($existingUser, 'getName') && $existingUser->getName()) {
            $displayName = $existingUser->getName();
        } elseif (
            (method_exists($existingUser, 'getFirstname') && $existingUser->getFirstname()) ||
            (method_exists($existingUser, 'getLastname') && $existingUser->getLastname())
        ) {
            $fn = method_exists($existingUser, 'getFirstname') ? ($existingUser->getFirstname() ?? '') : '';
            $ln = method_exists($existingUser, 'getLastname')  ? ($existingUser->getLastname()  ?? '') : '';
            $displayName = trim($fn.' '.$ln);
        } elseif (method_exists($existingUser, 'getEmail')) {
            $displayName = $existingUser->getEmail();
        } else {
            $displayName = 'Membre';
        }
    }

            $m = new Member();
            $m->setSpace($space);
            $m->setUser($existingUser);
            $m->setName($displayName);                 // 👈 OBLIGATOIRE pour NOT NULL
            $m->setRelationship($relationship);
            $m->setDateOfBirth($dob);
            $em->persist($m);
            $em->flush();

            return $this->json([
                'status' => 'added',
                'member' => [
                    'id' => $m->getId(),
                    'name' => $m->getName(),
                    'relationship' => $m->getRelationship(),
                    'date_of_birth' => $m->getDateOfBirth()?->format('Y-m-d'),
                    'user_id' => $existingUser->getId(),
                ]
            ]);
        }


        // pending existante (appel par entité Space en priorité)
        $pending = null;
        try {
            $pending = $invRepo->findOnePendingBySpaceAndEmail($space, $email);
        } catch (\TypeError $e) {
            // si ton repo est (string $spaceId, string $email)
            $pending = $invRepo->findOnePendingBySpaceAndEmail($space->getId(), $email);
        }

        if ($pending) {
            return $this->json([
                'status' => 'invited',
                'invite' => [
                    'id' => $pending->getId(),
                    'email' => $pending->getEmail(),
                    'relationship' => $pending->getRelationship(),
                    'expires_at' => $pending->getExpiresAt()?->format('Y-m-d'),
                    'token' => $pending->getToken(),
                ]
            ]);
        }

        $inv = (new Invitation())
            ->setSpace($space)
            ->setEmail($email)
            ->setInvitedBy($me)
            ->setRelationship($relationship)
            ->setDateOfBirth($dob)
            ->setExpiresAt((new \DateTimeImmutable())->modify('+14 days'));

        $em->persist($inv);
        $em->flush();

        return $this->json([
            'status' => 'invited',
            'invite' => [
                'id' => $inv->getId(),
                'email' => $inv->getEmail(),
                'relationship' => $inv->getRelationship(),
                'expires_at' => $inv->getExpiresAt()?->format('Y-m-d'),
                'token' => $inv->getToken(),
            ]
        ]);
    }

    #[Route('/all', name: 'get_all_members', methods: ['GET'])]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
public function getAllMembers(Request $request, MemberRepository $memberRepository, SpaceRepository $spaces): JsonResponse
{
    $me = $this->getUser();
    $spaceUuid = (string)($request->query->get('space_id') ?? '');

    if ($spaceUuid !== '') {
        $space = $spaces->find($spaceUuid);
        if (!$space) return $this->json(['error' => 'Espace introuvable'], 404);

        // autorisé si admin, owner de l’espace, ou membre de l’espace
        if (!$this->isGranted('ROLE_ADMIN')) {
            $isOwner = $space->getCreatedBy()?->getId() === $me->getId();
            $isMember = (bool)$memberRepository->createQueryBuilder('mm')
                ->select('COUNT(mm.id)')
                ->andWhere('mm.space = :s')->andWhere('mm.user = :u')
                ->setParameter('s', $space)->setParameter('u', $me)
                ->getQuery()->getSingleScalarResult();

            if (!$isOwner && !$isMember) {
                return $this->json(['error' => 'Forbidden'], 403);
            }
        }

        $members = $memberRepository->createQueryBuilder('m')
            ->andWhere('m.space = :space')->setParameter('space', $space)
            ->orderBy('m.id', 'ASC')
            ->getQuery()->getResult();
    } else {
        // sans espace : admin → tous ; sinon → seulement mes “Member” (m.user = me)
        if ($this->isGranted('ROLE_ADMIN')) {
            $members = $memberRepository->findBy([], ['id' => 'ASC']);
        } else {
            $members = $memberRepository->createQueryBuilder('m')
                ->leftJoin('m.user', 'u')->addSelect('u')
                ->andWhere('u = :me')->setParameter('me', $me)
                ->orderBy('m.id', 'ASC')
                ->getQuery()->getResult();
        }
    }

    $response = array_map(fn(Member $m) => [
        'id'            => $m->getId(),
        'name'          => $m->getName(),
        'relationship'  => $m->getRelationship(),
        'date_of_birth' => $m->getDateOfBirth()?->format('Y-m-d'),
        'space_id'      => $m->getSpace()->getId(),
        'space_name'    => $m->getSpace()->getName(),
        'user_id'       => $m->getUser()?->getId(),
    ], $members);

    return $this->json($response, Response::HTTP_OK);
}


    #[Route('/{id}', name: 'get_member_by_id', methods: ['GET'], requirements: ['id' => '[0-9a-fA-F-]{36}'])]
    public function getMemberById(string $id, MemberRepository $memberRepository): JsonResponse
    {
        $member = $memberRepository->find($id);
        if (!$member) return $this->json(['error' => 'Membre non trouvé'], Response::HTTP_NOT_FOUND);

        return $this->json([
            'id' => $member->getId(),
            'name' => $member->getName(),
            'relationship' => $member->getRelationship(),
            'date_of_birth' => $member->getDateOfBirth()?->format('Y-m-d'),
            'space' => $member->getSpace()->getName()
        ]);
    }

    #[Route('/update/{id}', name: 'update_member', methods: ['PUT'])]
    public function updateMember(
        string $id,
        Request $request,
        EntityManagerInterface $entityManager,
        MemberRepository $memberRepository,
        ValidatorInterface $validator
    ): JsonResponse {
        $member = $memberRepository->find($id);
        if (!$member) return $this->json(['error' => 'Membre non trouvé'], Response::HTTP_NOT_FOUND);

        $data = json_decode($request->getContent(), true);
        if (isset($data['name'])) $member->setName($data['name']);
        if (isset($data['relationship'])) $member->setRelationship($data['relationship']);
        if (isset($data['date_of_birth'])) $member->setDateOfBirth(new \DateTimeImmutable($data['date_of_birth']));

        $errors = $validator->validate($member);
        if (count($errors) > 0) return $this->json(['error' => (string) $errors], Response::HTTP_BAD_REQUEST);

        $entityManager->flush();
        return $this->json(['message' => 'Membre mis à jour avec succès'], Response::HTTP_OK);
    }

    #[Route('/delete/{id}', name: 'delete_member', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deleteMember(
        string $id,
        EntityManagerInterface $entityManager,
        MemberRepository $memberRepository
    ): JsonResponse {
        $member = $memberRepository->find($id);
        if (!$member) return $this->json(['error' => 'Membre non trouvé'], Response::HTTP_NOT_FOUND);

        $entityManager->remove($member);
        $entityManager->flush();

        return $this->json(['message' => 'Membre supprimé avec succès'], Response::HTTP_OK);
    }

    #[Route('/invitations', name: 'member_invitations_by_space', methods: ['GET'])]
public function invitationsBySpace(
    Request $req,
    InvitationRepository $invRepo,
    SpaceRepository $spaces
): JsonResponse {
    $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

    $spaceId = (string)($req->query->get('space_id') ?? '');
    if ($spaceId === '') return $this->json(['error' => 'space_id requis'], 400);

    $space = $spaces->find($spaceId);
    if (!$space) return $this->json(['error' => 'Espace introuvable'], 404);

    $me = $this->getUser();
    $isOwner = $space->getCreatedBy() && $space->getCreatedBy()->getId() === $me->getId();
    $isAdmin = \in_array('ROLE_ADMIN', $me->getRoles(), true);
    if (!$isOwner && !$isAdmin) return $this->json(['error' => 'Accès refusé'], 403);

    // Adapte si tu as un champ status; sinon filtre "pending" comme tu veux
    $list = $invRepo->findBy(['space' => $space], ['id' => 'DESC']);

    $out = array_map(function (Invitation $i) {
        return [
            'id'          => $i->getId(),
            'email'       => $i->getEmail(),
            'relationship'=> $i->getRelationship(),
            'expires_at'  => $i->getExpiresAt()?->format('Y-m-d'),
            'status'      => method_exists($i, 'getStatus') ? $i->getStatus() : 'pending',
            'token'       => $i->getToken(),
        ];
    }, $list);

    return $this->json($out);
}

#[Route('/invitation/cancel/{id}', name: 'member_invitation_cancel', methods: ['POST','DELETE'])]
public function cancelInvitation(
    string $id,
    InvitationRepository $invRepo,
    EntityManagerInterface $em
): JsonResponse {
    $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

    $inv = $invRepo->find($id);
    if (!$inv) return $this->json(['error' => 'Invitation introuvable'], 404);

    $space = $inv->getSpace();
    $me = $this->getUser();
    $isOwner = $space->getCreatedBy() && $space->getCreatedBy()->getId() === $me->getId();
    $isAdmin = \in_array('ROLE_ADMIN', $me->getRoles(), true);
    if (!$isOwner && !$isAdmin) return $this->json(['error' => 'Accès refusé'], 403);

    $em->remove($inv);
    $em->flush();

    return $this->json(['message' => 'Invitation annulée']);
}

#[Route('/invitation/resend/{id}', name: 'member_invitation_resend', methods: ['POST'])]
public function resendInvitation(
    string $id,
    InvitationRepository $invRepo,
    EntityManagerInterface $em
): JsonResponse {
    $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

    $inv = $invRepo->find($id);
    if (!$inv) return $this->json(['error' => 'Invitation introuvable'], 404);

    $space = $inv->getSpace();
    $me = $this->getUser();
    $isOwner = $space->getCreatedBy() && $space->getCreatedBy()->getId() === $me->getId();
    $isAdmin = \in_array('ROLE_ADMIN', $me->getRoles(), true);
    if (!$isOwner && !$isAdmin) return $this->json(['error' => 'Accès refusé'], 403);

    // "Renvoyer" = prolonger la validité; plugge ton envoi d’email ici si besoin
    $inv->setExpiresAt((new \DateTimeImmutable())->modify('+14 days'));
    $em->flush();

    return $this->json(['message' => 'Invitation renvoyée', 'expires_at' => $inv->getExpiresAt()?->format('Y-m-d')]);
}

}
