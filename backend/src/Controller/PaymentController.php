<?php

namespace App\Controller;

use App\Entity\Payment;
use App\Entity\Subscription;
use App\Repository\PaymentRepository;
use App\Repository\SubscriptionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpFoundation\Response;
use OpenApi\Annotations as OA;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/payment')]
/**
 * @OA\Tag(name="Payment")
 * Contrôleur pour gérer les paiements liés aux abonnements.
 */
class PaymentController extends AbstractController
{
    /**
     * @OA\Post(
     *     path="/api/payment/create",
     *     summary="Créer un paiement",
     *     description="Ajoute un nouveau paiement à un abonnement donné.",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"amount", "currency", "payment_method", "subscription_id"},
     *             @OA\Property(property="amount", type="number", example=12.99),
     *             @OA\Property(property="currency", type="string", example="EUR"),
     *             @OA\Property(property="payment_method", type="string", example="credit_card"),
     *             @OA\Property(property="subscription_id", type="string", example="uuid-abonnement"),
     *             @OA\Property(property="transaction_id", type="string", example="txn_123456")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Paiement créé avec succès"),
     *     @OA\Response(response=400, description="Données invalides"),
     *     @OA\Response(response=404, description="Abonnement non trouvé")
     * )
     */
    #[Route('/create', name: 'create_payment', methods: ['POST'])]
    public function createPayment(
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        SubscriptionRepository $subscriptionRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['amount'], $data['currency'], $data['payment_method'], $data['subscription_id'])) {
            return $this->json(['error' => 'Tous les champs requis doivent être renseignés'], Response::HTTP_BAD_REQUEST);
        }

        $subscription = $subscriptionRepository->find($data['subscription_id']);
        if (!$subscription) {
            return $this->json(['error' => 'Abonnement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $payment = new Payment();
        $payment->setAmount($data['amount']);
        $payment->setCurrency($data['currency']);
        $payment->setPaymentMethod($data['payment_method']);
        $payment->setTransactionId($data['transaction_id'] ?? null);
        $payment->setSubscription($subscription);
        $payment->setStatus(Payment::STATUS_PENDING);

        $errors = $validator->validate($payment);
        if (count($errors) > 0) {
            return $this->json(['error' => (string) $errors], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($payment);
        $entityManager->flush();

        return $this->json([
            'message' => 'Paiement créé avec succès',
            'payment' => [
                'id' => $payment->getId(),
                'amount' => $payment->getAmount(),
                'currency' => $payment->getCurrency(),
                'payment_method' => $payment->getPaymentMethod(),
                'status' => $payment->getStatus(),
                'subscription_id' => $subscription->getId()
            ]
        ], Response::HTTP_CREATED);
    }

    /**
     * @OA\Get(path="/api/payment/all", summary="Récupérer tous les paiements")
     */
    #[Route('/all', name: 'get_all_payments', methods: ['GET'])]
    public function getAllPayments(Request $req, PaymentRepository $paymentRepository): JsonResponse
    {
        $subId = $req->query->get('subscriptionId');
        if ($subId) {
            $qb = $paymentRepository->createQueryBuilder('p')
                ->join('p.subscription','s')
                ->andWhere('s.id = :sid')->setParameter('sid', $subId)
                ->orderBy('p.created_at','DESC');
            $payments = $qb->getQuery()->getResult();
        } else {
            $payments = $paymentRepository->findBy([], ['created_at' => 'DESC']);
        }

        $response = array_map(fn($payment) => [
            'id' => $payment->getId(),
            'amount' => $payment->getAmount(),
            'currency' => $payment->getCurrency(),
            'payment_method' => $payment->getPaymentMethod(),
            'status' => $payment->getStatus(),
            'subscription_id' => $payment->getSubscription()->getId()
        ], $payments);

        return $this->json($response, Response::HTTP_OK);
    }


    /**
     * @OA\Get(path="/api/payment/{id}", summary="Récupérer un paiement par ID")
     */
    #[Route('/{id}', name: 'get_payment_by_id', methods: ['GET'])]
    public function getPaymentById(string $id, PaymentRepository $paymentRepository): JsonResponse
    {
        $payment = $paymentRepository->find($id);
        if (!$payment) {
            return $this->json(['error' => 'Paiement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id' => $payment->getId(),
            'amount' => $payment->getAmount(),
            'currency' => $payment->getCurrency(),
            'payment_method' => $payment->getPaymentMethod(),
            'status' => $payment->getStatus(),
            'subscription_id' => $payment->getSubscription()->getId()
        ]);
    }

    /**
     * @OA\Put(path="/api/payment/update/{id}", summary="Mettre à jour un paiement")
     */
    #[Route('/update/{id}', name: 'update_payment', methods: ['PUT'])]
    public function updatePayment(
        string $id,
        Request $request,
        EntityManagerInterface $entityManager,
        PaymentRepository $paymentRepository
    ): JsonResponse {
        $payment = $paymentRepository->find($id);
        if (!$payment) {
            return $this->json(['error' => 'Paiement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true) ?? [];

        // On ne change pas le montant/la devise via update (évite les surprises)
        if (array_key_exists('payment_method', $data)) {
            $payment->setPaymentMethod($data['payment_method']);
        }

        if (array_key_exists('transaction_id', $data)) {
            $payment->setTransactionId($data['transaction_id'] ?: null);
        }

        if (array_key_exists('status', $data)) {
            $status = $data['status'];

            if ($status === Payment::STATUS_COMPLETED) {
                $payment->markAsCompleted();

                // Effets sur la souscription
                $sub = $payment->getSubscription();
                if ($sub) {
                    // Status actif
                    if (method_exists($sub, 'setStatus')) {
                        $sub->setStatus('active');
                    }

                    // Démarrage si manquant (ton UI lit start_date/end_date)
                    $now = new \DateTimeImmutable();
                    // compatibilité : start_date ou startedAt selon ta classe
                    if (method_exists($sub, 'getStartDate') && method_exists($sub, 'setStartDate')) {
                        if (!$sub->getStartDate()) $sub->setStartDate($now);
                    } elseif (method_exists($sub, 'getStartedAt') && method_exists($sub, 'setStartedAt')) {
                        if (!$sub->getStartedAt()) $sub->setStartedAt($now);
                    }

                    // Prochain renouvellement si tu as ces champs
                    if (method_exists($sub, 'getBillingFrequency') && method_exists($sub, 'setNextRenewalAt')) {
                        $bf = $sub->getBillingFrequency(); // 'monthly' | 'yearly' | …
                        $interval = $bf === 'yearly' ? 'P1Y' : 'P1M';
                        $sub->setNextRenewalAt($now->add(new \DateInterval($interval)));
                    }
                }
            } elseif ($status === Payment::STATUS_FAILED) {
                $payment->markAsFailed();
            } elseif ($status === Payment::STATUS_CANCELLED) {
                $payment->cancelPayment();
            } else {
                // autre status => setter classique si besoin
                $payment->setStatus($status);
            }
        }

        $entityManager->flush();

        return $this->json([
            'message' => 'Paiement mis à jour avec succès',
            'payment' => [
                'id' => $payment->getId(),
                'status' => $payment->getStatus(),
                'transaction_id' => $payment->getTransactionId(),
                'subscription_id' => $payment->getSubscription()->getId(),
            ]
        ], Response::HTTP_OK);
    }


    /**
     * @OA\Delete(path="/api/payment/delete/{id}", summary="Supprimer un paiement")
     */
    #[Route('/delete/{id}', name: 'delete_payment', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deletePayment(string $id, EntityManagerInterface $entityManager, PaymentRepository $paymentRepository): JsonResponse
    {
        $payment = $paymentRepository->find($id);
        if (!$payment) {
            return $this->json(['error' => 'Paiement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $entityManager->remove($payment);
        $entityManager->flush();

        return $this->json(['message' => 'Paiement supprimé avec succès'], Response::HTTP_OK);
    }
}
