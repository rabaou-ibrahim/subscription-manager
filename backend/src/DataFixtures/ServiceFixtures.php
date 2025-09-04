<?php

namespace App\DataFixtures;

use App\Entity\Service;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class ServiceFixtures extends Fixture
{
    public const REF_NETFLIX = 'svc_netflix';
    public const REF_SPOTIFY = 'svc_spotify';
    public const REF_ORANGE  = 'svc_orange';

    public function load(ObjectManager $em): void
    {
        // ref, name, provider, website (URL valide), logo (string), description (NotBlank)
        $rows = [
            [self::REF_NETFLIX, 'Netflix', 'Netflix, Inc.', 'https://www.netflix.com', 'https://cdn.example.com/icons/netflix.png',  'Plateforme de streaming vidéo'],
            [self::REF_SPOTIFY, 'Spotify', 'Spotify AB',   'https://www.spotify.com', 'https://cdn.example.com/icons/spotify.png',  'Service de streaming musical'],
            [self::REF_ORANGE,  'Orange',  'Orange SA',    'https://www.orange.fr',   'https://cdn.example.com/icons/orange.png',   'Opérateur télécom et internet'],
        ];

        foreach ($rows as [$ref, $name, $provider, $website, $logo, $desc]) {
            $s = (new Service())
                ->setName($name)
                ->setProvider($provider)
                ->setWebsite($website)       // @Assert\Url → mettre une URL valide
                ->setLogo($logo)             // NotBlank → on renseigne
                ->setDescription($desc)      // NotBlank → on renseigne
                // ->setStatus(Service::STATUS_ACTIVE) // inutile : default déjà ACTIVE
                // ->setCurrency('EUR')               // inutile : default déjà EUR
            ;

            $em->persist($s);
            $this->addReference($ref, $s);
        }

        $em->flush();
    }
}
