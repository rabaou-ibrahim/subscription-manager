<?php
// src/Repository/InvitationRepository.php
namespace App\Repository;

use App\Entity\Invitation;
use App\Entity\Space;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class InvitationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    { parent::__construct($registry, Invitation::class); }

    /** @return Invitation[] */
    public function findPendingBySpace(Space $space): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.space = :space')
            ->andWhere('i.status = :st')
            ->setParameter('space', $space)
            ->setParameter('st', Invitation::STATUS_PENDING)
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()->getResult();
    }

    public function findPendingByEmail(string $email): array
        {
            return $this->createQueryBuilder('i')
                ->join('i.space', 's')->addSelect('s')
                ->andWhere('LOWER(i.email) = :email')
                ->andWhere('i.status = :st')
                ->andWhere('(i.expiresAt IS NULL OR i.expiresAt > :now)')
                ->setParameter('email', strtolower($email))
                ->setParameter('st', Invitation::STATUS_PENDING)
                ->setParameter('now', new \DateTimeImmutable())
                ->orderBy('i.createdAt', 'ASC')
                ->getQuery()->getResult();
        }

    public function findOnePendingBySpaceAndEmail(Space $space, string $email): ?Invitation
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.space = :space')
            ->andWhere('i.email = :em')
            ->andWhere('i.status = :st')
            ->setParameter('space', $space)
            ->setParameter('em', strtolower($email))
            ->setParameter('st', Invitation::STATUS_PENDING)
            ->setMaxResults(1)
            ->getQuery()->getOneOrNullResult();
    }
}
