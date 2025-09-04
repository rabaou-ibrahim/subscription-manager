<?php

namespace App\Entity;

use App\Repository\PermissionRepository;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Doctrine\UuidGenerator;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PermissionRepository::class)]
#[ORM\Table(name: "permissions")] // Ajout du nom de la table
#[ORM\HasLifecycleCallbacks]
class Permission
{
    public const TYPE_ADMIN = 'ROLE_ADMIN';
    public const TYPE_EDITOR = 'ROLE_EDITOR';
    public const TYPE_VIEWER = 'ROLE_VIEWER';

    public const ROLES_AVAILABLE = [
        self::TYPE_ADMIN,
        self::TYPE_EDITOR,
        self::TYPE_VIEWER
    ];

    public const STATUS_ACTIVE = 'active';
    public const STATUS_REVOKED = 'revoked';

    #[ORM\Id]
    #[ORM\Column(type: "guid", unique: true)] // Remplacement de "uuid" par "guid"
    #[ORM\GeneratedValue(strategy: "CUSTOM")]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?string $id = null;

    #[Assert\NotBlank]
    #[Assert\Choice(choices: self::ROLES_AVAILABLE, message: "Type de permission invalide.")]
    #[ORM\Column(length: 255)]
    private ?string $permission_type = null;

    #[ORM\Column(type: "datetime_immutable")]
    private ?\DateTimeImmutable $assigned_at = null;

    #[ORM\Column(type: "datetime_immutable", nullable: true)]
    private ?\DateTimeImmutable $updated_at = null;

    #[Assert\NotBlank]
    #[Assert\Choice(choices: [self::STATUS_ACTIVE, self::STATUS_REVOKED], message: "Statut de permission invalide.")]
    #[ORM\Column(length: 20, options: ["default" => self::STATUS_ACTIVE])]
    private ?string $status = self::STATUS_ACTIVE;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: "permissions")]
    #[ORM\JoinColumn(nullable: false, onDelete: "CASCADE")]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Space::class, inversedBy: "permissions")]
    #[ORM\JoinColumn(nullable: true, onDelete: "SET NULL")]
    private ?Space $space = null;

    public function __construct()
    {
        $this->assigned_at = new \DateTimeImmutable();
        $this->status = self::STATUS_ACTIVE;
    }

    #[ORM\PrePersist]
    public function setCreationTimestamps(): void
    {
        if ($this->assigned_at === null) {
            $this->assigned_at = new \DateTimeImmutable();
        }
        if ($this->updated_at === null) {
            $this->updated_at = new \DateTimeImmutable();
        }
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

    public function getPermissionType(): ?string
    {
        return $this->permission_type;
    }

    public function setPermissionType(string $permission_type): static
    {
        if (!in_array($permission_type, self::ROLES_AVAILABLE, true)) {
            throw new \InvalidArgumentException("Type de permission invalide.");
        }
        $this->permission_type = $permission_type;
        return $this;
    }

    public function assignPermission(User $user, string $permission_type, ?Space $space = null): static
    {
        $this->setUser($user);
        $this->setPermissionType($permission_type);
        $this->setSpace($space);
        return $this;
    }

    public function revokePermission(): static
    {
        $this->status = self::STATUS_REVOKED;
        $this->updateTimestamps();
        return $this;
    }

    public function restorePermission(): static
    {
        $this->status = self::STATUS_ACTIVE;
        $this->updateTimestamps();
        return $this;
    }

    public function getAssignedAt(): ?\DateTimeImmutable
    {
        return $this->assigned_at;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updated_at;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        if (!in_array($status, [self::STATUS_ACTIVE, self::STATUS_REVOKED])) {
            throw new \InvalidArgumentException("Statut de permission invalide.");
        }
        $this->status = $status;
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

    public function getSpace(): ?Space
    {
        return $this->space;
    }

    public function setSpace(?Space $space): static
    {
        $this->space = $space;
        return $this;
    }

    public function isAdmin(): bool
    {
        return $this->permission_type === self::TYPE_ADMIN;
    }

    public function isEditor(): bool
    {
        return $this->permission_type === self::TYPE_EDITOR;
    }

    public function isViewer(): bool
    {
        return $this->permission_type === self::TYPE_VIEWER;
    }
}
