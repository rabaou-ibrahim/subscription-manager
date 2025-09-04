<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Entity\User;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpFoundation\Response;
use OpenApi\Annotations as OA;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/notification')]
/**
 * @OA\Tag(name="Notification")
 * Contrôleur pour gérer les notifications.
 */
class NotificationController extends AbstractController
{
    /**
     * @OA\Post(
     *     path="/api/notification/create",
     *     summary="Créer une nouvelle notification",
     *     description="Ajoute une nouvelle notification destinée à un utilisateur spécifique.",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"message", "receiver_id"},
     *             @OA\Property(property="message", type="string", example="Nouvelle mise à jour disponible."),
     *             @OA\Property(property="receiver_id", type="string", example="UUID de l'utilisateur")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Notification créée avec succès"),
     *     @OA\Response(response=400, description="Données invalides"),
     *     @OA\Response(response=404, description="Utilisateur non trouvé")
     * )
     */
    #[Route('/create', name: 'create_notification', methods: ['POST'])]
    public function createNotification(
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['message'], $data['receiver_id'])) {
            return $this->json(['error' => 'Tous les champs requis doivent être renseignés'], Response::HTTP_BAD_REQUEST);
        }

        $receiver = $entityManager->getRepository(User::class)->find($data['receiver_id']);
        if (!$receiver) {
            return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // $notification = new Notification();
        // $notification->setMessage($data['message']);
        // $notification->setReceiver($receiver);
        // $notification->setSender($this->getUser());
        $notification = new Notification();
        $notification->setMessage($data['message']);
        $notification->setReceiver($receiver);
        $notification->setSender($this->getUser());
        $notification->setNotificationType($data['notification_type'] ?? 'info');


        $errors = $validator->validate($notification);
        if (count($errors) > 0) {
            return $this->json(['error' => (string) $errors], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($notification);
        $entityManager->flush();

        return $this->json([
            'message' => 'Notification créée avec succès',
            'notification' => [
                'id' => $notification->getId(),
                'message' => $notification->getMessage(),
                'sender' => $notification->getSender()->getEmail(),
                'receiver' => $notification->getReceiver()->getEmail(),
                'created_at' => $notification->getCreatedAt()->format('Y-m-d\TH:i:sP')
            ]
        ], Response::HTTP_CREATED);
    }

    /**
     * @OA\Get(path="/api/notification/all", summary="Récupérer toutes les notifications")
     */
    #[Route('/all', name: 'get_all_notifications', methods: ['GET'])]
    public function getAllNotifications(NotificationRepository $notificationRepository): JsonResponse
    {
        $notifications = $notificationRepository->findAll();

        $response = array_map(fn($notification) => [
            'id' => $notification->getId(),
            'message' => $notification->getMessage(),
            'sender' => $notification->getSender()->getEmail(),
            'receiver' => $notification->getReceiver()->getEmail(),
            'created_at' => $notification->getCreatedAt()->format('Y-m-d\TH:i:sP'),
            'read_at' => $notification->getReadAt() ? $notification->getReadAt()->format('Y-m-d\TH:i:sP') : null
        ], $notifications);

        return $this->json($response, Response::HTTP_OK);
    }

    /**
     * @OA\Get(path="/api/notification/{id}", summary="Récupérer une notification par ID")
     */
    #[Route('/{id}', name: 'get_notification_by_id', methods: ['GET'])]
    public function getNotificationById(string $id, NotificationRepository $notificationRepository): JsonResponse
    {
        $notification = $notificationRepository->find($id);
        if (!$notification) {
            return $this->json(['error' => 'Notification non trouvée'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id' => $notification->getId(),
            'message' => $notification->getMessage(),
            'sender' => $notification->getSender()->getEmail(),
            'receiver' => $notification->getReceiver()->getEmail(),
            'created_at' => $notification->getCreatedAt()->format('Y-m-d\TH:i:sP'),
            'read_at' => $notification->getReadAt() ? $notification->getReadAt()->format('Y-m-d\TH:i:sP') : null
        ]);
    }

    /**
     * @OA\Patch(path="/api/notification/mark-read/{id}", summary="Marquer une notification comme lue")
     */
    #[Route('/mark-read/{id}', name: 'mark_notification_read', methods: ['PATCH'])]
    public function markNotificationAsRead(
        string $id,
        EntityManagerInterface $entityManager,
        NotificationRepository $notificationRepository
    ): JsonResponse {
        $notification = $notificationRepository->find($id);
        if (!$notification) {
            return $this->json(['error' => 'Notification non trouvée'], Response::HTTP_NOT_FOUND);
        }

        $notification->markAsRead();
        $entityManager->flush();

        return $this->json(['message' => 'Notification marquée comme lue'], Response::HTTP_OK);
    }

    /**
     * @OA\Delete(path="/api/notification/delete/{id}", summary="Supprimer une notification")
     */
    #[Route('/delete/{id}', name: 'delete_notification', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deleteNotification(
        string $id,
        EntityManagerInterface $entityManager,
        NotificationRepository $notificationRepository
    ): JsonResponse {
        $notification = $notificationRepository->find($id);
        if (!$notification) {
            return $this->json(['error' => 'Notification non trouvée'], Response::HTTP_NOT_FOUND);
        }

        $entityManager->remove($notification);
        $entityManager->flush();

        return $this->json(['message' => 'Notification supprimée avec succès'], Response::HTTP_OK);
    }
}
