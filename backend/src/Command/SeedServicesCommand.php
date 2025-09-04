<?php
namespace App\Command;

use App\Entity\Service;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:seed:services', description: 'Importe le catalogue des services depuis un JSON')]
class SeedServicesCommand extends Command
{
    public function __construct(private EntityManagerInterface $em) { parent::__construct(); }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $path = \dirname(__DIR__, 2).'/seeds/services.seed.json';
        if (!is_file($path)) {
            $output->writeln("<error>Seed JSON introuvable: $path</error>");
            return Command::FAILURE;
        }

        $rows = json_decode(file_get_contents($path), true) ?? [];
        $repo = $this->em->getRepository(Service::class);

        $count = 0;
        foreach ($rows as $row) {
            $name = trim((string)($row['name'] ?? ''));
            if ($name === '') continue;
            $provider = trim((string)($row['provider'] ?? ''));

            // upsert (name, provider)
            $svc = $repo->findOneBy(['name' => $name, 'provider' => ($provider !== '' ? $provider : null)])
                ?? new Service();

            $svc->setName($name);
            $svc->setProvider($provider !== '' ? $provider : null);

            $desc = trim((string)($row['description'] ?? ''));
if ($desc === '') {
    // on fabrique une petite phrase propre
    // ex: "Netflix · Netflix, Inc. · netflix.com"
    $host = null;
    if (!empty($row['website'])) {
        $host = parse_url((string)$row['website'], PHP_URL_HOST);
    }
    $parts = array_filter([$name, $provider ?: null, $host ?: null]);
    $desc = implode(' · ', $parts);
    if ($desc === '') {
        $desc = $name; // ultime filet de sécurité
    }
}
$svc->setDescription($desc);

if (method_exists($svc, 'setWebsite')) {
    $svc->setWebsite($row['website'] ?? null);
}
if (method_exists($svc, 'setLogo')) {
    $svc->setLogo($row['logo'] ?? null);
}
if (method_exists($svc, 'setCurrency') && !empty($row['currency'])) {
    $svc->setCurrency($row['currency']);
}

            if (isset($row['description']) && method_exists($svc, 'setDescription')) {
                $svc->setDescription((string)$row['description']);
            }

            if (method_exists($svc, 'setWebsite')) {
                $svc->setWebsite($row['website'] ?? null);
            }
            if (method_exists($svc, 'setLogo')) {
                $svc->setLogo($row['logo'] ?? null);
            }
            if (method_exists($svc, 'setCurrency') && !empty($row['currency'])) {
                $svc->setCurrency($row['currency']);
            }

            // ⚠️ PAS de setCategory ici (on ne connaît pas ta Category)
            // if (!empty($row['category'])) { ... }

            $this->em->persist($svc);
            $count++;
        }

        $this->em->flush();
        $output->writeln("<info>$count services importés/à jour.</info>");
        return Command::SUCCESS;
    }
}
