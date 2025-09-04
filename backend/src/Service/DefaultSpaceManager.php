<?php

namespace App\Service;

use App\Entity\{User, Space, Member};
use Doctrine\ORM\EntityManagerInterface;

final class DefaultSpaceManager
{
    public function __construct(private EntityManagerInterface $em) {}

    /** Premier Member de l'utilisateur, ou création (espace perso + member). */
    public function ensureMemberFor(User $user): Member
    {
        $member = $this->em->getRepository(Member::class)->createQueryBuilder('m')
            ->andWhere('m.user = :u')->setParameter('u', $user)
            ->setMaxResults(1)->getQuery()->getOneOrNullResult();
        if ($member) return $member;

        $space = (new Space())->setName('Perso · '.($user->getEmail() ?? 'Moi'));
        $this->em->persist($space);

        $member = (new Member())->setUser($user)->setSpace($space)->setRole('owner');
        $this->em->persist($member);

        $this->em->flush(); // ids dispos
        return $member;
    }

    /** Vérifie que le member appartient bien à l'utilisateur courant. */
    public function memberOfUserOrNull(User $user, string $memberId): ?Member
    {
        $m = $this->em->getRepository(Member::class)->find($memberId);
        return ($m && $m->getUser()?->getId() === $user->getId()) ? $m : null;
    }
}
