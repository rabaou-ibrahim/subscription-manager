<?php

namespace App\Controller;

use App\Entity\Subscription;
use App\Entity\Tag;
use App\Entity\SubscriptionTag;
use App\Repository\SubscriptionTagRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use OpenApi\Annotations as OA;

#[Route('/api/subscription-tag')]
/**
 * @OA\Tag(name="SubscriptionTag")
 */
class SubscriptionTagController extends AbstractController
{
    #[Route('/create', name: 'create_subscription_tag', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager,
        LoggerInterface $logger
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);

            if (!isset($data['subscription_id'], $data['tag_id'])) {
                return $this->json(['error' => 'Les champs subscription_id et tag_id sont requis'], Response::HTTP_BAD_REQUEST);
            }

            $subscription = $entityManager->getRepository(Subscription::class)->find($data['subscription_id']);
            $tag = $entityManager->getRepository(Tag::class)->find($data['tag_id']);

            if (!$subscription || !$tag) {
                return $this->json(['error' => 'Subscription ou Tag introuvable'], Response::HTTP_NOT_FOUND);
            }

            $subscriptionTag = new SubscriptionTag();
            $subscriptionTag->setSubscription($subscription);
            $subscriptionTag->setTag($tag);
            $subscriptionTag->setStatus(SubscriptionTag::STATUS_ACTIVE);

            $entityManager->persist($subscriptionTag);
            $entityManager->flush();

            return $this->json([
                'message' => 'Subscription Tag créé avec succès',
                'subscription_tag' => [
                    'id' => $subscriptionTag->getId(),
                    'status' => $subscriptionTag->getStatus()
                ]
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            $logger->error('Erreur lors de la création du SubscriptionTag : ' . $e->getMessage());
            return $this->json(['error' => 'Erreur serveur'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/all', name: 'get_all_subscription_tags', methods: ['GET'])]
    public function getAll(SubscriptionTagRepository $repository): JsonResponse
    {
        $subscriptionTags = $repository->findAll();
        $response = array_map(fn($tag) => [
            'id' => $tag->getId(),
            'status' => $tag->getStatus()
        ], $subscriptionTags);
        return $this->json($response, Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'get_subscription_tag', methods: ['GET'])]
    public function getById(string $id, SubscriptionTagRepository $repository): JsonResponse
    {
        $subscriptionTag = $repository->find($id);
        if (!$subscriptionTag) {
            return $this->json(['error' => 'Subscription Tag non trouvé'], Response::HTTP_NOT_FOUND);
        }
        return $this->json([
            'id' => $subscriptionTag->getId(),
            'status' => $subscriptionTag->getStatus()
        ], Response::HTTP_OK);
    }

    #[Route('/delete/{id}', name: 'delete_subscription_tag', methods: ['DELETE'])]
    public function delete(string $id, EntityManagerInterface $entityManager, SubscriptionTagRepository $repository): JsonResponse
    {
        $subscriptionTag = $repository->find($id);
        if (!$subscriptionTag) {
            return $this->json(['error' => 'Subscription Tag non trouvé'], Response::HTTP_NOT_FOUND);
        }
        $entityManager->remove($subscriptionTag);
        $entityManager->flush();
        return $this->json(['message' => 'Subscription Tag supprimé avec succès'], Response::HTTP_OK);
    }
}
