<?php

namespace App\Controller;

use App\Entity\{Subscription, Member};
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpFoundation\Response;
use OpenApi\Annotations as OA;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/subscription')]
/**
 * @OA\Tag(name="Subscription")
 */
class SubscriptionController extends AbstractController
{
    /**
     * @OA\Post(
     *     path="/api/subscription/create",
     *     summary="Create a new subscription",
     *     description="Adds a subscription for a user or a family member.",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "subscription_type", "start_date"},
     *             @OA\Property(property="name", type="string", example="Netflix Premium"),
     *             @OA\Property(property="subscription_type", type="string", example="monthly"),
     *             @OA\Property(property="start_date", type="string", format="date", example="2024-01-01"),
     *             @OA\Property(property="end_date", type="string", format="date", example="2024-12-31"),
     *             @OA\Property(property="amount", type="number", example=15.99),
     *             @OA\Property(property="currency", type="string", example="EUR"),
     *             @OA\Property(property="billing_mode", type="string", example="credit_card")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Subscription created successfully"),
     *     @OA\Response(response=400, description="Invalid data")
     * )
     */
    // #[Route('/create', name: 'create_subscription', methods: ['POST'])]
    // public function createSubscription(
    //     Request $request,
    //     EntityManagerInterface $entityManager,
    //     ValidatorInterface $validator,
    //     LoggerInterface $logger
    // ): JsonResponse {
    //     try {
    //         $data = json_decode($request->getContent(), true);

    //         if (!isset($data['name'], $data['subscription_type'], $data['start_date'])) {
    //             return $this->json(['error' => 'Missing required fields'], Response::HTTP_BAD_REQUEST);
    //         }

    //         $subscription = new Subscription();
    //         $subscription->setName($data['name']);
    //         $subscription->setSubscriptionType($data['subscription_type']);
    //         $subscription->setStartDate(new \DateTime($data['start_date']));
    //         $subscription->setEndDate(isset($data['end_date']) ? new \DateTime($data['end_date']) : null);
    //         $subscription->setAmount($data['amount'] ?? null);
    //         $subscription->setCurrency($data['currency'] ?? 'EUR');
    //         $subscription->setBillingMode($data['billing_mode'] ?? 'unknown');

    //         $errors = $validator->validate($subscription);
    //         if (count($errors) > 0) {
    //             return $this->json(['error' => (string) $errors], Response::HTTP_BAD_REQUEST);
    //         }

    //         $entityManager->persist($subscription);
    //         $entityManager->flush();

    //         return $this->json(['message' => 'Subscription created successfully'], Response::HTTP_CREATED);
    //     } catch (\Exception $e) {
    //         $logger->error('Error creating subscription: ' . $e->getMessage());
    //         return $this->json(['error' => 'Server error'], Response::HTTP_INTERNAL_SERVER_ERROR);
    //     }
    // }


    /**
     * @OA\Post(
     *     path="/api/subscription/create",
     *     summary="Create a new subscription",
     *     security={{"bearerAuth": {}}},
     *     description="Adds a subscription for a user or a family member.",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "subscription_type", "start_date", "member_id"},
     *             @OA\Property(property="name", type="string", example="Netflix Premium"),
     *             @OA\Property(property="subscription_type", type="string", example="monthly"),
     *             @OA\Property(property="start_date", type="string", format="date", example="2024-01-01"),
     *             @OA\Property(property="end_date", type="string", format="date", example="2024-12-31"),
     *             @OA\Property(property="amount", type="number", example=15.99),
     *             @OA\Property(property="currency", type="string", example="EUR"),
     *             @OA\Property(property="billing_mode", type="string", example="credit_card"),
     *             @OA\Property(property="member_id", type="string", example="uuid")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Subscription created successfully"),
     *     @OA\Response(response=400, description="Invalid data"),
     *     @OA\Response(response=404, description="Member not found")
     * )
     */
    private function ok(array $data = [], int $code = Response::HTTP_OK): JsonResponse
    {
        return $this->json(['status' => 'ok'] + $data, $code);
    }

    private function err(string $message, int $code, array $extra = []): JsonResponse
    {
        // format uniforme côté front
        return $this->json(['status' => 'error', 'message' => $message] + $extra, $code);
    }

    private function normalizeViolations($violations): array
    {
        $out = [];
        foreach ($violations as $v) {
            $out[] = ['field' => $v->getPropertyPath(), 'message' => $v->getMessage()];
        }
        return $out;
    }

    private function mapSubscription(Subscription $s): array
    {
        return [
            'id'                => $s->getId(),
            'name'              => $s->getName(),
            'subscription_type' => $s->getSubscriptionType(),
            'amount'            => $s->getAmount(),
            'currency'          => $s->getCurrency(),
            'start_date'        => $s->getStartDate()?->format('Y-m-d'),
            'end_date'          => $s->getEndDate()?->format('Y-m-d'),
            'billing_mode'      => $s->getBillingMode(),
            'billing_frequency' => $s->getBillingFrequency(),
            'auto_renewal'      => $s->getAutoRenewal(),
            'status'            => $s->getStatus(),
            'service_id'        => $s->getService()?->getId(),
            'member_id'         => $s->getMember()?->getId(),
            'created_at'        => $s->getCreatedAt()?->format(DATE_ATOM),
            'updated_at'        => $s->getUpdatedAt()?->format(DATE_ATOM),
        ];
    }

    #[Route('/create', name: 'create_subscription', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function createSubscription(
        Request $request,
        EntityManagerInterface $em,
        ValidatorInterface $validator,
        LoggerInterface $logger
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true) ?? [];

            // Requis MINIMUM (member_id devient optionnel)
            foreach (['name','subscription_type','start_date','service_id'] as $k) {
                if (!isset($data[$k]) || $data[$k] === '') {
                    return $this->err('Champs requis manquants', Response::HTTP_BAD_REQUEST, ['missing' => $k]);
                }
            }

            $user = $this->getUser();

            // Relations
            $service = $em->getRepository(\App\Entity\Service::class)->find($data['service_id']);
            if (!$service) return $this->err('Service introuvable', 404);

            $member = null;
            if (!empty($data['member_id'])) {
                $member = $em->getRepository(\App\Entity\Member::class)->find($data['member_id']);
                if (!$member) return $this->err('Membre introuvable', 404);
                // Autorisation : admin OU propriétaire du member
                if (!$this->isGranted('ROLE_ADMIN') && $member->getUser()?->getId() !== $user?->getId()) {
                    return $this->err('Forbidden', 403);
                }
            }

            // Dates
            try {
                $start = new \DateTimeImmutable($data['start_date']);
                $end   = !empty($data['end_date']) ? new \DateTimeImmutable($data['end_date']) : null;
                $billingDay = !empty($data['billing_day']) ? new \DateTimeImmutable($data['billing_day']) : null;
            } catch (\Throwable $e) {
                return $this->err('Format de date invalide (YYYY-MM-DD)', 400);
            }

            // Doublons : scope par "owner"
            $repo = $em->getRepository(Subscription::class);
            if ($member) {
                // Cas "espace" → doublon par MEMBER
                $dupName = $repo->createQueryBuilder('s')
                    ->andWhere('s.member = :m')->setParameter('m', $member)
                    ->andWhere('LOWER(s.name) = LOWER(:n)')->setParameter('n', trim((string)$data['name']))
                    ->setMaxResults(1)->getQuery()->getOneOrNullResult();
                $dupService = $repo->findOneBy(['member' => $member, 'service' => $service]);
            } else {
                // Cas "perso" → doublon par USER
                $dupName = $repo->createQueryBuilder('s')
                    ->andWhere('s.user = :u')->setParameter('u', $user)
                    ->andWhere('s.member IS NULL')
                    ->andWhere('LOWER(s.name) = LOWER(:n)')->setParameter('n', trim((string)$data['name']))
                    ->setMaxResults(1)->getQuery()->getOneOrNullResult();
                $dupService = $repo->findOneBy(['user' => $user, 'member' => null, 'service' => $service]);
            }
            if ($dupName || $dupService) {
                return $this->err(
                    'Un abonnement identique existe déjà (même nom ou même service).',
                    Response::HTTP_CONFLICT,
                    ['code' => 'DUPLICATE']
                );
            }

            // Construction
            $sub = new Subscription();
            $sub->setName(trim((string)$data['name']));
            $sub->setSubscriptionType((string)$data['subscription_type']);
            $sub->setStartDate($start);
            $sub->setEndDate($end);
            $sub->setService($service);
            $sub->setUser($user);
            $sub->setMember($member); // peut rester null

            // Montant/devise
            $rawAmount = $data['amount'] ?? 0;
            if (is_string($rawAmount)) { $rawAmount = str_replace(',', '.', $rawAmount); }
            $sub->setAmount($rawAmount);
            $sub->setCurrency($data['currency'] ?? 'EUR');

            // Facturation
            $sub->setBillingMode($data['billing_mode'] ?? 'unknown');
            if (!empty($data['billing_frequency'])) $sub->setBillingFrequency((string)$data['billing_frequency']);
            if (!empty($billingDay)) $sub->setBillingDay($billingDay);
            if (array_key_exists('auto_renewal', $data)) $sub->setAutoRenewal((bool)$data['auto_renewal']);

            // Divers
            if (array_key_exists('status', $data)) $sub->setStatus((string)$data['status']);
            if (array_key_exists('notes', $data))  $sub->setNotes($data['notes'] ?? null);

            // Validation
            $violations = $validator->validate($sub);
            if (count($violations) > 0) {
                return $this->err('Données invalides', 400, ['fields' => $this->normalizeViolations($violations)]);
            }

            $em->persist($sub);
            $em->flush();

            return $this->ok([
                'message' => 'Abonnement créé',
                'id'      => $sub->getId(),
            ], Response::HTTP_CREATED);

        } catch (\Throwable $e) {
            $logger->error('createSubscription: '.$e->getMessage());
            return $this->err('Erreur serveur', 500);
        }
    }


    #[Route('/all', name: 'get_all_subscriptions', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getAllSubscriptions(EntityManagerInterface $em): JsonResponse
    {
        $me = $this->getUser();

        $qb = $em->getRepository(Subscription::class)->createQueryBuilder('s')
            ->leftJoin('s.user', 'u')->addSelect('u')
            ->leftJoin('s.member', 'm')->addSelect('m')
            ->leftJoin('m.user', 'mu')->addSelect('mu');

        if (!$this->isGranted('ROLE_ADMIN')) {
            $qb->andWhere('u = :me OR mu = :me')->setParameter('me', $me);
        }

        $subs = $qb->getQuery()->getResult();

        return $this->json(array_map([$this, 'mapSubscription'], $subs));
    }

    #[Route('/update/{id}', name: 'update_subscription', methods: ['PUT','PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateSubscription(string $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $sub = $em->getRepository(Subscription::class)->find($id);
        if (!$sub) return $this->json(['error' => 'Subscription not found'], 404);

        $user = $this->getUser();
        if (
            !$this->isGranted('ROLE_ADMIN') &&
            $sub->getUser()?->getId() !== $user?->getId() &&
            $sub->getMember()?->getUser()?->getId() !== $user?->getId()
        ) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        $data = json_decode($request->getContent(), true) ?? [];

        // -- helpers
        $toDate = function (?string $s): ?\DateTimeImmutable {
            if (!$s) return null;
            $dt = \DateTimeImmutable::createFromFormat('Y-m-d', $s);
            return $dt ?: null;
        };
        $toBool = fn($v) => filter_var($v, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool)$v;

        // -- mapping champ par champ (on met à jour seulement si la clé est présente)
        if (array_key_exists('name', $data)) {
            $sub->setName(trim((string)$data['name']));
        }
        if (array_key_exists('notes', $data)) {
            $notes = $data['notes'];
            $sub->setNotes($notes === '' ? null : $notes);
        }
        if (array_key_exists('amount', $data)) {
            // normalise en "xx.yy"
            $sub->setAmount(number_format((float)$data['amount'], 2, '.', ''));
        }
        if (array_key_exists('currency', $data)) {
            $sub->setCurrency($data['currency']);
        }
        if (array_key_exists('billing_frequency', $data)) {
            // 'monthly' | 'yearly' | 'weekly' | 'daily'
            $sub->setBillingFrequency($data['billing_frequency']);
        }
        if (array_key_exists('subscription_type', $data)) {
            $sub->setSubscriptionType($data['subscription_type']);
        }
        if (array_key_exists('start_date', $data)) {
            $sub->setStartDate($toDate($data['start_date']));
        }
        if (array_key_exists('end_date', $data)) {
            $sub->setEndDate($toDate($data['end_date']));
        }
        if (array_key_exists('billing_mode', $data)) {
            $sub->setBillingMode($data['billing_mode']); // 'cash', 'paypal', ...
        }
        if (array_key_exists('auto_renewal', $data)) {
            $sub->setAutoRenewal($toBool($data['auto_renewal']));
        }
        if (array_key_exists('status', $data)) {
            // 'active' | 'inactive' | ...
            $sub->setStatus($data['status']);
        }
        if (array_key_exists('service_id', $data)) {
            if ($data['service_id']) {
                $svc = $em->getRepository(\App\Entity\Service::class)->find($data['service_id']);
                if (!$svc) return $this->json(['error' => 'Service not found'], 400);
                $sub->setService($svc);
            } else {
                $sub->setService(null);
            }
        }


        if (array_key_exists('member_id', $data)) {
            if ($data['member_id']) {
                $member = $em->getRepository(\App\Entity\Member::class)->find($data['member_id']);
                if (!$member) return $this->json(['error' => 'Member not found'], 400);
                if (!$this->isGranted('ROLE_ADMIN') && $member->getUser()?->getId() !== $user?->getId()) {
                    return $this->json(['error' => 'Forbidden'], 403);
                }
                $sub->setMember($member);
            } else {
                // null / vide → détache du space (perso)
                $sub->setMember(null);
            }
        }

        $em->flush();
        return $this->json(['message' => 'Subscription updated']);
    }

    /**
     * @OA\Delete(
     *     path="/api/subscription/delete/{id}",
     *     summary="Supprimer une souscription",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Subscription supprimée"),
     *     @OA\Response(response=403, description="Non autorisé"),
     *     @OA\Response(response=404, description="Subscription introuvable")
     * )
     */


    #[Route('/delete/{id}', name: 'delete_subscription', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function deleteSubscription(string $id, EntityManagerInterface $em): JsonResponse
    {
        $subscription = $em->getRepository(Subscription::class)->find($id);
        if (!$subscription) {
            return $this->json(['error' => 'Subscription not found'], 404);
        }

        $user = $this->getUser();
        if (
            !$this->isGranted('ROLE_ADMIN') &&
            $subscription->getUser()?->getId() !== $user?->getId() &&
            $subscription->getMember()?->getUser()?->getId() !== $user?->getId()
        ) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        // suppression + flush + réponse JSON
        $em->remove($subscription);
        $em->flush();

        return $this->json(['message' => 'Subscription deleted', 'id' => $id], 200);
    }


    #[Route('/mine', name: 'get_my_subscriptions', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getMySubscriptions(EntityManagerInterface $em): JsonResponse
    {
        $me = $this->getUser();

        $subs = $em->getRepository(Subscription::class)->createQueryBuilder('s')
            ->leftJoin('s.user', 'u')->addSelect('u')
            ->leftJoin('s.member', 'm')->addSelect('m')
            ->leftJoin('m.user', 'mu')->addSelect('mu')
            ->andWhere('u = :me OR mu = :me')
            ->setParameter('me', $me)
            ->getQuery()->getResult();

        return $this->json(array_map([$this, 'mapSubscription'], $subs));
    }

    #[Route('/cancel/{id}', name: 'cancel_subscription', methods: ['PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function cancelSubscription(string $id, EntityManagerInterface $em): JsonResponse
    {
        $sub = $em->getRepository(Subscription::class)->find($id);
        if (!$sub) return $this->json(['error' => 'Subscription not found'], 404);

        $user = $this->getUser();
        if (
            !$this->isGranted('ROLE_ADMIN') &&
            $sub->getUser()?->getId() !== $user?->getId() &&
            $sub->getMember()?->getUser()?->getId() !== $user?->getId()
        ) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        $sub->setEndDate(new \DateTimeImmutable()); // obsolète à partir d’aujourd’hui
        $em->flush();

        return $this->json(['message' => 'Subscription cancelled']);
    }
}
