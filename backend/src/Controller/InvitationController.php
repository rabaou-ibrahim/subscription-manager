<?php

namespace App\Controller;

use App\Entity\Invitation;
use App\Entity\Member; // 👈 on utilisera Member (pas SpaceMember)
use App\Repository\InvitationRepository;
use App\Repository\MemberRepository;
use App\Repository\SpaceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

/** 👇 Préfixe de classe cohérent avec MemberController */
#[Route('/api/invite')]
class InvitationController extends AbstractController
{
    // ADMIN / OWNER : liste des invits d’un espace
    #[Route('/all', name: 'invite_all', methods: ['GET'])]
    public function all(Request $req, SpaceRepository $spaces, InvitationRepository $repo): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $spaceId = (string) $req->query->get('space_id');
        if ($spaceId === '') return $this->json(['error' => 'space_id manquant'], 400);

        $space = $spaces->find($spaceId);
        if (!$space) return $this->json(['error' => 'Espace introuvable'], 404);

        $me = $this->getUser();
        $isOwner = $space->getCreatedBy() && $space->getCreatedBy()->getId() === $me->getId();
        $isAdmin = \in_array('ROLE_ADMIN', $me->getRoles(), true);
        if (!$isOwner && !$isAdmin) return $this->json(['error' => 'Accès refusé'], 403);

        $qb = $repo->createQueryBuilder('i')
            ->join('i.space', 's')->addSelect('s')
            ->where('i.space = :space')
            ->andWhere('i.status = :st')
            ->setParameter('space', $space)
            ->setParameter('st', Invitation::STATUS_PENDING)
            ->orderBy('i.createdAt', 'DESC');

        $list = $qb->getQuery()->getResult();

        $out = array_map(static function(Invitation $i) {
            return [
                'id'           => $i->getId(),
                'email'        => $i->getEmail(),
                'space_id'     => $i->getSpace()->getId(),
                'space_name'   => $i->getSpace()->getName(),
                'relationship' => $i->getRelationship(),
                'expires_at'   => $i->getExpiresAt()?->format('Y-m-d'),
                'token'        => $i->getToken(),
                'status'       => $i->getStatus(),
            ];
        }, $list);

        return $this->json($out);
    }

    #[Route('/mine', name: 'invite_mine', methods: ['GET'])]
    public function mine(Request $req, InvitationRepository $repo, SpaceRepository $spaces): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $email   = strtolower($this->getUser()->getEmail());
        $spaceId = (string) ($req->query->get('space_id') ?? '');

        $qb = $repo->createQueryBuilder('i')
            ->join('i.space', 's')->addSelect('s')
            ->where('i.email = :em')
            ->andWhere('i.status = :st')
            ->setParameter('em', $email)
            ->setParameter('st', Invitation::STATUS_PENDING)
            ->orderBy('i.createdAt', 'DESC');

        if ($spaceId !== '') {
            $space = $spaces->find($spaceId);
            if (!$space) return $this->json(['error' => 'Espace introuvable'], 404);
            $qb->andWhere('i.space = :space')->setParameter('space', $space);
        }

        $list = $qb->getQuery()->getResult();

        $out = array_map(static function(Invitation $i) {
            return [
                'id'           => $i->getId(),
                'email'        => $i->getEmail(),
                'space_id'     => $i->getSpace()->getId(),
                'space_name'   => $i->getSpace()->getName(),
                'relationship' => $i->getRelationship(),
                'expires_at'   => $i->getExpiresAt()?->format('Y-m-d'),
                'token'        => $i->getToken(),
                'status'       => $i->getStatus(),
                'created_at'   => $i->getCreatedAt()->format(DATE_ATOM),
            ];
        }, $list);

        return $this->json($out);
    }

    // Annuler (soft-cancel) — admin/owner
    #[Route('/delete/{id}', name: 'invite_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id, InvitationRepository $repo, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $inv = $repo->find($id);
        if (!$inv) return $this->json(['error' => 'Invitation introuvable'], 404);

        $me = $this->getUser();
        $space = $inv->getSpace();
        $isOwner = $space->getCreatedBy() && $space->getCreatedBy()->getId() === $me->getId();
        $isAdmin = \in_array('ROLE_ADMIN', $me->getRoles(), true);
        if (!$isOwner && !$isAdmin) return $this->json(['error' => 'Accès refusé'], 403);

        $inv->setStatus(Invitation::STATUS_CANCELED);
        $em->flush();

        return $this->json(['ok' => true]);
    }

    #[Route('/accept/{id}', name: 'invitation_accept_by_id', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function acceptById(
        int $id,
        InvitationRepository $repo,
        MemberRepository $members,
        Security $security,
        EntityManagerInterface $em
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $inv = $repo->find($id);
        if (!$inv) return $this->json(['error' => 'Invitation introuvable'], 404);

        $user = $security->getUser();
        if (strtolower($inv->getEmail()) !== strtolower($user->getEmail()))
            return $this->json(['error' => 'Cette invitation ne vous est pas destinée'], 403);

        if ($inv->getStatus() !== Invitation::STATUS_PENDING)
            return $this->json(['error' => 'Invitation déjà traitée'], 400);

        if (method_exists($inv, 'isExpired') && $inv->isExpired())
            return $this->json(['error' => 'Invitation expirée'], 400);

        $space = $inv->getSpace();
        if (!$members->findOneBy(['space' => $space, 'user' => $user])) {
            $m = (new Member())
                ->setSpace($space)
                ->setUser($user)
                ->setName(method_exists($user, 'getName') && $user->getName() ? $user->getName() : $user->getEmail())
                ->setRelationship($inv->getRelationship())
                ->setDateOfBirth($inv->getDateOfBirth());
            $em->persist($m);
        }

        $inv->setStatus(Invitation::STATUS_ACCEPTED);
        $em->flush();

        return $this->json(['ok' => true]);
    }

    #[Route('/decline/{id}', name: 'invitation_decline_by_id', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function declineById(
        int $id,
        InvitationRepository $repo,
        Security $security,
        EntityManagerInterface $em
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $inv = $repo->find($id);
        if (!$inv) return $this->json(['error' => 'Invitation introuvable'], 404);

        $user = $security->getUser();
        if (strtolower($inv->getEmail()) !== strtolower($user->getEmail()))
            return $this->json(['error' => 'Cette invitation ne vous est pas destinée'], 403);

        if ($inv->getStatus() === Invitation::STATUS_PENDING) {
            $inv->setStatus(Invitation::STATUS_DECLINED);
            $em->flush();
        }

        return $this->json(['ok' => true]);
        }
}
