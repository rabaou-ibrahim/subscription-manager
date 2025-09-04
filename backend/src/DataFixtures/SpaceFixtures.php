<?php

namespace App\DataFixtures;

use App\Entity\Space;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;

class SpaceFixtures extends Fixture implements DependentFixtureInterface
{
    public const REF_SPACE_ADMIN = 'space_admin';
    public const REF_SPACE_USER1 = 'space_user1';

    public function load(ObjectManager $em): void
    {
        $admin = $this->getReference(UserFixtures::REF_ADMIN);
        $user1 = $this->getReference(UserFixtures::REF_USER_1);

        $s1 = (new Space())->setName('Famille Admin')->setOwner($admin)->setIsDefault(true);
        $s2 = (new Space())->setName('Perso User1')->setOwner($user1)->setIsDefault(true);

        $em->persist($s1);
        $em->persist($s2);

        $this->addReference(self::REF_SPACE_ADMIN, $s1);
        $this->addReference(self::REF_SPACE_USER1, $s2);

        $em->flush();
    }

    public function getDependencies(): array
    {
        return [UserFixtures::class];
    }
}
