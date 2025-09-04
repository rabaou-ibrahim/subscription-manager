<?php

namespace App\Entity;

use App\Repository\NotificationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Doctrine\UuidGenerator;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: NotificationRepository::class)]
#[ORM\Table(name: "notifications")] // Ajout du nom de la table
#[ORM\HasLifecycleCallbacks]
class Notification
{
    public const TYPE_INFO = 'info';
    public const TYPE_WARNING = 'warning';
    public const TYPE_ERROR = 'error';

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
    #[Assert\Choice(choices: [self::TYPE_INFO, self::TYPE_WARNING, self::TYPE_ERROR], message: "Type de notification invalide.")]
    #[ORM\Column(length: 255)]
    private ?string $notification_type = null;

    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 500)]
    #[ORM\Column(type: Types::TEXT)]
    private ?string $message = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $sent_at = null;

    #[Assert\Choice(choices: self::STATUS_TYPES, message: "Statut de notification invalide.")]
    #[ORM\Column(length: 20, options: ["default" => self::STATUS_PENDING])]
    private ?string $status = self::STATUS_PENDING;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: "notifications")]
    #[ORM\JoinColumn(nullable: true, onDelete: "SET NULL")]
    private ?User $sender = null;

    #[ORM\ManyToOne(targetEntity: Space::class, inversedBy: "notifications")]
    #[ORM\JoinColumn(nullable: true, onDelete: "SET NULL")]
    private ?Space $space = null;

    #[ORM\OneToMany(mappedBy: "notification", targetEntity: NotificationTarget::class, cascade: ["persist", "remove"])]
    private Collection $notificationTargets;

    #[ORM\Column]
    private ?\DateTimeImmutable $updated_at = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: "CASCADE")]
    private ?User $receiver = null;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->created_at = $now;
        $this->updated_at = $now;
        $this->notificationTargets = new ArrayCollection();
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

    public function getNotificationType(): ?string
    {
        return $this->notification_type;
    }

    public function setNotificationType(string $notification_type): static
    {
        if (!in_array($notification_type, [self::TYPE_INFO, self::TYPE_WARNING, self::TYPE_ERROR])) {
            throw new \InvalidArgumentException("Type de notification invalide.");
        }
        $this->notification_type = $notification_type;
        return $this;
    }

    public function getReceiver(): ?User
    {
        return $this->receiver;
    }
    
    public function setReceiver(?User $receiver): static
    {
        $this->receiver = $receiver;
        return $this;
    }

    public function isInfo(): bool
    {
        return $this->notification_type === self::TYPE_INFO;
    }

    public function isWarning(): bool
    {
        return $this->notification_type === self::TYPE_WARNING;
    }

    public function isError(): bool
    {
        return $this->notification_type === self::TYPE_ERROR;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(string $message): static
    {
        $this->message = $message;
        return $this;
    }

    public function getSentAt(): ?\DateTimeImmutable
    {
        return $this->sent_at;
    }

    public function markAsSent(): static
    {
        $this->status = self::STATUS_SENT;
        $this->sent_at = new \DateTimeImmutable();
        $this->updateTimestamps();
        return $this;
    }

    public function isSent(): bool
    {
        return $this->status === self::STATUS_SENT;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->created_at;
    }

    public function getSender(): ?User
    {
        return $this->sender;
    }

    public function setSender(?User $sender): static
    {
        $this->sender = $sender;
        return $this;
    }

    public function getSpace(): ?Space
    {
        return $this->space;
    }

    public function setSpace(?Space $space): static
    {
        $this->space = $space;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updated_at;
    }

    public function getNotificationTargets(): Collection
    {
        return $this->notificationTargets;
    }

    public function addNotificationTarget(NotificationTarget $target): static
    {
        if (!$this->notificationTargets->contains($target)) {
            $this->notificationTargets->add($target);
            $target->setNotification($this);
        }
        return $this;
    }

    public function removeNotificationTarget(NotificationTarget $target): static
    {
        if ($this->notificationTargets->removeElement($target)) {
            if ($target->getNotification() === $this) {
                $target->setNotification(null);
            }
        }
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

    public function markAsRead(): static
    {
        $this->status = self::STATUS_READ;
        $this->updateTimestamps();
        return $this;
    }

    public function markAsUnread(): static
    {
        $this->status = self::STATUS_PENDING;
        $this->updateTimestamps();
        return $this;
    }

    public function isRead(): bool
    {
        return $this->status === self::STATUS_READ;
    }

    public function setUpdatedAt(\DateTimeImmutable $updated_at): static
    {
        $this->updated_at = $updated_at;
        return $this;
    }
}
