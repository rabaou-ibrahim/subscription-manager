<?php

namespace App\Controller;

use App\Entity\Service;
use App\Repository\ServiceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpFoundation\Response;
use OpenApi\Annotations as OA;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/service')]
/**
 * @OA\Tag(name="Service")
 * Contrôleur pour gérer les services.
 */
class ServiceController extends AbstractController
{
    /**
     * @OA\Post(
     *     path="/api/service/create",
     *     summary="Créer un service",
     *     description="Ajoute un nouveau service avec un nom unique et une description.",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "description", "logo"},
     *             @OA\Property(property="name", type="string", example="Netflix"),
     *             @OA\Property(property="description", type="string", example="Service de streaming vidéo."),
     *             @OA\Property(property="provider", type="string", example="Netflix Inc."),
     *             @OA\Property(property="logo", type="string", example="netflix_logo.png"),
     *             @OA\Property(property="website", type="string", example="https://www.netflix.com"),
     *             @OA\Property(property="currency", type="string", example="EUR"),
     *             @OA\Property(property="category_id", type="string", example="uuid-catégorie")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Service créé avec succès"),
     *     @OA\Response(response=400, description="Données invalides"),
     *     @OA\Response(response=409, description="Service déjà existant")
     * )
     */
    #[Route('/create', name: 'create_service', methods: ['POST'])]
    public function createService(
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        ServiceRepository $serviceRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['name'], $data['description'], $data['logo'])) {
            return $this->json(['error' => 'Tous les champs requis doivent être renseignés'], Response::HTTP_BAD_REQUEST);
        }

        if ($serviceRepository->findOneBy(['name' => $data['name']])) {
            return $this->json(['error' => 'Ce service existe déjà'], Response::HTTP_CONFLICT);
        }

        $service = new Service();
        $service->setName($data['name']);
        $service->setDescription($data['description']);
        $service->setProvider($data['provider'] ?? null);
        $service->setLogo($data['logo']);
        $service->setWebsite($data['website'] ?? null);
        $service->setCurrency($data['currency'] ?? 'EUR');
        $service->setStatus(Service::STATUS_ACTIVE);

        $errors = $validator->validate($service);
        if (count($errors) > 0) {
            return $this->json(['error' => (string) $errors], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($service);
        $entityManager->flush();

        return $this->json([
            'message' => 'Service créé avec succès',
            'service' => [
                'id' => $service->getId(),
                'name' => $service->getName(),
                'description' => $service->getDescription(),
                'logo' => $service->getLogo(),
                'website' => $service->getWebsite(),
                'status' => $service->getStatus()
            ]
        ], Response::HTTP_CREATED);
    }

    /**
     * @OA\Get(path="/api/service/all", summary="Récupérer tous les services")
     */
    #[Route('/all', name: 'get_all_services', methods: ['GET'])]
    public function getAllServices(ServiceRepository $serviceRepository): JsonResponse
    {
        $services = $serviceRepository->findAll();

        $response = array_map(fn($service) => [
            'id' => $service->getId(),
            'name' => $service->getName(),
            'description' => $service->getDescription(),
            'logo' => $service->getLogo(),
            'status' => $service->getStatus()
        ], $services);

        return $this->json($response, Response::HTTP_OK);
    }

    /**
     * @OA\Get(path="/api/service/{id}", summary="Récupérer un service par ID")
     */
    #[Route('/{id}', name: 'get_service_by_id', methods: ['GET'])]
    public function getServiceById(string $id, ServiceRepository $serviceRepository): JsonResponse
    {
        $service = $serviceRepository->find($id);
        if (!$service) {
            return $this->json(['error' => 'Service non trouvé'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id' => $service->getId(),
            'name' => $service->getName(),
            'description' => $service->getDescription(),
            'logo' => $service->getLogo(),
            'status' => $service->getStatus()
        ]);
    }

    /**
     * @OA\Put(path="/api/service/update/{id}", summary="Mettre à jour un service")
     */
    #[Route('/update/{id}', name: 'update_service', methods: ['PUT'])]
    public function updateService(
        string $id,
        Request $request,
        EntityManagerInterface $entityManager,
        ServiceRepository $serviceRepository
    ): JsonResponse {
        $service = $serviceRepository->find($id);
        if (!$service) {
            return $this->json(['error' => 'Service non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        $service->setName($data['name'] ?? $service->getName());
        $service->setDescription($data['description'] ?? $service->getDescription());
        $service->setLogo($data['logo'] ?? $service->getLogo());
        $service->setWebsite($data['website'] ?? $service->getWebsite());

        $entityManager->flush();

        return $this->json(['message' => 'Service mis à jour avec succès'], Response::HTTP_OK);
    }

    /**
     * @OA\Delete(path="/api/service/delete/{id}", summary="Supprimer un service")
     */
    #[Route('/delete/{id}', name: 'delete_service', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deleteService(string $id, EntityManagerInterface $entityManager, ServiceRepository $serviceRepository): JsonResponse
    {
        $service = $serviceRepository->find($id);
        if (!$service) {
            return $this->json(['error' => 'Service non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $entityManager->remove($service);
        $entityManager->flush();

        return $this->json(['message' => 'Service supprimé avec succès'], Response::HTTP_OK);
    }
}
