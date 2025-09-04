<?php

namespace App\Entity;

use App\Repository\SubscriptionTagRepository;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Doctrine\UuidGenerator;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: SubscriptionTagRepository::class)]
#[ORM\Table(name: "subscription_tags")] // Ajout du nom de la table pour éviter les conflits
#[ORM\HasLifecycleCallbacks]
class SubscriptionTag
{
    public const STATUS_ACTIVE = 'active';
    public const STATUS_REMOVED = 'removed';

    private const STATUS_TYPES = [self::STATUS_ACTIVE, self::STATUS_REMOVED];

    #[ORM\Id]
    #[ORM\Column(type: "guid", unique: true)] // Remplacement de "uuid" par "guid"
    #[ORM\GeneratedValue(strategy: "CUSTOM")]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?string $id = null; // Correction du type

    #[ORM\ManyToOne(targetEntity: Subscription::class, inversedBy: "subscriptionTags")]
    #[ORM\JoinColumn(nullable: false, onDelete: "CASCADE")]
    private ?Subscription $subscription = null;

    #[ORM\ManyToOne(targetEntity: Tag::class, inversedBy: "subscriptionTags")]
    #[ORM\JoinColumn(nullable: false, onDelete: "CASCADE")]
    private ?Tag $tag = null;

    #[ORM\Column(length: 20, options: ["default" => self::STATUS_ACTIVE])]
    private ?string $status = self::STATUS_ACTIVE;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $read_at = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updated_at = null;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->created_at = $now;
        $this->updated_at = $now;
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $now = new \DateTimeImmutable();
        $this->created_at = $now;
        $this->updated_at = $now;
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updated_at = new \DateTimeImmutable();
    }

    public function getId(): ?string
    {
        return $this->id; // Retourne une string plutôt qu'un objet UUIDInterface
    }

    public function getSubscription(): ?Subscription
    {
        return $this->subscription;
    }

    public function setSubscription(?Subscription $subscription): static
    {
        $this->subscription = $subscription;
        return $this;
    }

    public function getTag(): ?Tag
    {
        return $this->tag;
    }

    public function setTag(?Tag $tag): static
    {
        $this->tag = $tag;
        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        if (!in_array($status, self::STATUS_TYPES, true)) {
            throw new \InvalidArgumentException("Statut invalide.");
        }
        $this->status = $status;
        return $this;
    }

    public function removeTag(): static
    {
        $this->status = self::STATUS_REMOVED;
        $this->updated_at = new \DateTimeImmutable();
        return $this;
    }

    public function activateTag(): static
    {
        $this->status = self::STATUS_ACTIVE;
        $this->updated_at = new \DateTimeImmutable();
        return $this;
    }

    public function isRemoved(): bool
    {
        return $this->status === self::STATUS_REMOVED;
    }

    public function getReadAt(): ?\DateTimeImmutable
    {
        return $this->read_at;
    }

    public function markAsRead(): static
    {
        $this->read_at = new \DateTimeImmutable();
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->created_at;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updated_at;
    }

    public function setUpdatedAt(\DateTimeImmutable $updated_at): static
    {
        $this->updated_at = $updated_at;
        return $this;
    }
}
