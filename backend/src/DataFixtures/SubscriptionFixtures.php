<?php

namespace App\DataFixtures;

use App\Entity\Subscription;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;

class SubscriptionFixtures extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $em): void
    {
        $user  = $this->getReference(UserFixtures::REF_USER_1);
        $space = $this->getReference(SpaceFixtures::REF_SPACE_USER1);

        $netflix = $this->getReference(ServiceFixtures::REF_NETFLIX);
        $spotify = $this->getReference(ServiceFixtures::REF_SPOTIFY);

        // Netflix mensuel
        $s1 = (new Subscription())
            ->setName('Netflix Premium')
            ->setAmount(17.99)
            ->setSubscriptionType('monthly')
            ->setStartDate(new \DateTimeImmutable('first day of -2 months'))
            ->setStatus('active')
            ->setUser($user)
            ->setSpace($space)
            ->setService($netflix);

        $s2 = (new Subscription())
            ->setName('Spotify Duo')
            ->setAmount(119.99)
            ->setSubscriptionType('yearly')
            ->setStartDate(new \DateTimeImmutable('first day of January'))
            ->setStatus('active')
            ->setUser($user)
            ->setSpace($space)
            ->setService($spotify);

        $em->persist($s1);
        $em->persist($s2);
        $em->flush();
    }

    public function getDependencies(): array
    {
        return [UserFixtures::class, SpaceFixtures::class, ServiceFixtures::class];
    }
}
