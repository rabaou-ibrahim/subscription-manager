<?php

namespace App\Entity;

use App\Repository\InvitationRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: InvitationRepository::class)]
#[ORM\Table(name: 'invitation')]
class Invitation
{
    public const STATUS_PENDING   = 'pending';
    public const STATUS_ACCEPTED  = 'accepted';
    public const STATUS_CANCELED  = 'canceled';
    public const STATUS_EXPIRED   = 'expired';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // Espace concerné
    #[ORM\ManyToOne(inversedBy: 'invitations')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Space $space = null;

    // Email invité (pas encore user)
    #[ORM\Column(length: 180)]
    private string $email = '';

    // Qui a invité
    #[ORM\ManyToOne]
    private ?User $invitedBy = null;

    // Données pour créer le membre à l’accept
    #[ORM\Column(length: 24)]
    private string $relationship = 'friend';

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $dateOfBirth = null;

    // Token à partager
    #[ORM\Column(length: 96, unique: true)]
    private string $token;

    #[ORM\Column(length: 16)]
    private string $status = self::STATUS_PENDING;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $expiresAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->token = bin2hex(random_bytes(24));
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSpace(): ?Space
    {
        return $this->space;
    }

    public function setSpace(Space $s): self
    {
        $this->space = $s;
        return $this;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $e): self
    {
        $this->email = strtolower(trim($e));
        return $this;
    }

    public function getInvitedBy(): ?User
    {
        return $this->invitedBy;
    }

    public function setInvitedBy(?User $u): self
    {
        $this->invitedBy = $u;
        return $this;
    }

    public function getRelationship(): string
    {
        return $this->relationship;
    }

    public function setRelationship(string $r): self
    {
        $this->relationship = $r;
        return $this;
    }

    public function getDateOfBirth(): ?\DateTimeImmutable
    {
        return $this->dateOfBirth;
    }

    public function setDateOfBirth(?\DateTimeImmutable $d): self
    {
        $this->dateOfBirth = $d;
        return $this;
    }

    public function getToken(): string
    {
        return $this->token;
    }

    public function setToken(string $t): self
    {
        $this->token = $t;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $s): self
    {
        $this->status = $s;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getExpiresAt(): ?\DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(?\DateTimeImmutable $e): self
    {
        $this->expiresAt = $e;
        return $this;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }
}
