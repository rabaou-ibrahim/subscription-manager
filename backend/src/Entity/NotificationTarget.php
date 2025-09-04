<?php

namespace App\Entity;

use App\Repository\NotificationTargetRepository;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Doctrine\UuidGenerator;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: NotificationTargetRepository::class)]
#[ORM\Table(name: "notification_targets")] // Ajout du nom de la table
#[ORM\HasLifecycleCallbacks]
class NotificationTarget
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_SENT = 'sent';
    public const STATUS_READ = 'read';

    private const STATUS_TYPES = [self::STATUS_PENDING, self::STATUS_SENT, self::STATUS_READ];

    #[ORM\Id]
    #[ORM\Column(type: "guid", unique: true)] // Remplacement de "uuid" par "guid"
    #[ORM\GeneratedValue(strategy: "CUSTOM")]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?string $id = null;

    #[Assert\NotBlank]
    #[ORM\ManyToOne(targetEntity: Notification::class, inversedBy: "notificationTargets")]
    #[ORM\JoinColumn(nullable: false, onDelete: "CASCADE")]
    private ?Notification $notification = null;

    #[Assert\NotBlank]
    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: "notificationTargets")]
    #[ORM\JoinColumn(nullable: false, onDelete: "CASCADE")]
    private ?User $user = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $read_at = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updated_at = null;

    #[Assert\NotBlank]
    #[Assert\Choice(choices: self::STATUS_TYPES, message: "Statut de notification invalide.")]
    #[ORM\Column(length: 20, options: ["default" => self::STATUS_PENDING])]
    private ?string $status = self::STATUS_PENDING;

    #[ORM\Column(type: "boolean", options: ["default" => false])]
    private bool $is_important = false;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->created_at = $now;
        $this->updated_at = $now;
    }

    #[ORM\PrePersist]
    public function setCreationTimestamps(): void
    {
        if ($this->created_at === null) {
            $this->created_at = new \DateTimeImmutable();
        }
        $this->updated_at = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function updateTimestamps(): void
    {
        $this->updated_at = new \DateTimeImmutable();
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getNotification(): ?Notification
    {
        return $this->notification;
    }

    public function setNotification(?Notification $notification): static
    {
        $this->notification = $notification;
        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getReadAt(): ?\DateTimeImmutable
    {
        return $this->read_at;
    }

    public function setReadAt(?\DateTimeImmutable $read_at): static
    {
        $this->read_at = $read_at;
        return $this;
    }

    public function markAsRead(): static
    {
        $this->status = self::STATUS_READ;
        $this->read_at = new \DateTimeImmutable();
        $this->updateTimestamps();
        return $this;
    }

    public function markAsUnread(): static
    {
        $this->status = self::STATUS_PENDING;
        $this->read_at = null;
        $this->updateTimestamps();
        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        if (!in_array($status, self::STATUS_TYPES, true)) {
            throw new \InvalidArgumentException("Statut de notification invalide.");
        }
        $this->status = $status;
        $this->updateTimestamps();
        return $this;
    }

    public function markAsSent(): static
    {
        $this->status = self::STATUS_SENT;
        $this->updateTimestamps();
        return $this;
    }

    public function isRead(): bool
    {
        return $this->status === self::STATUS_READ;
    }

    public function isImportant(): bool
    {
        return $this->is_important;
    }

    public function setIsImportant(bool $is_important): static
    {
        $this->is_important = $is_important;
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
