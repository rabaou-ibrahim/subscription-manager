<?php

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Faker\Factory;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserFixtures extends Fixture
{
    public function __construct(private UserPasswordHasherInterface $hasher) {}

    public function load(ObjectManager $em): void
    {
        $faker = Factory::create('fr_FR');

        // Admin
        $admin = (new User())
            ->setFirstname('Admin')
            ->setLastname('User')
            ->setEmail('admin@example.com')
            ->setRoles(['ROLE_ADMIN'])
            ->setIsActive(true);
        $admin->setPassword($this->hasher->hashPassword($admin, 'admin12345'));
        $em->persist($admin);

        // 5 utilisateurs
        for ($i=1; $i<=5; $i++) {
            $u = (new User())
                ->setFirstname($faker->firstName())
                ->setLastname($faker->lastName())
                ->setEmail("user{$i}@example.com")
                ->setRoles(['ROLE_USER'])
                ->setIsActive(true);
            $u->setPassword($this->hasher->hashPassword($u, 'user12345'));
            $em->persist($u);
        }

        $em->flush();
    }
}
