<?php

namespace App\Entity;

use App\Repository\MemberRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Doctrine\UuidGenerator;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: MemberRepository::class)]
#[ORM\Table(name: "members")] // Ajout du nom de la table
#[ORM\HasLifecycleCallbacks]
class Member
{
    public const RELATION_PARENT = 'parent';
    public const RELATION_CHILD = 'child';
    public const RELATION_PARTNER = 'partner';
    public const RELATION_FRIEND = 'friend';
    public const RELATION_OTHER = 'other';
    public const RELATION_SELF = 'self';


    private const RELATION_TYPES = [
        self::RELATION_PARENT,
        self::RELATION_CHILD,
        self::RELATION_PARTNER,
        self::RELATION_FRIEND,
        self::RELATION_OTHER,
        self::RELATION_SELF
    ];

    #[ORM\Id]
    #[ORM\Column(type: "guid", unique: true)] // Remplacement de "uuid" par "guid"
    #[ORM\GeneratedValue(strategy: "CUSTOM")]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?string $id = null;

    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 255)]
    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[Assert\Choice(choices: self::RELATION_TYPES, message: "Relation invalide.")]
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $relationship = null;

    #[Assert\Type("\DateTimeInterface")]
    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $date_of_birth = null;

    #[ORM\ManyToOne(targetEntity: Space::class, inversedBy: "members")]
    #[ORM\JoinColumn(nullable: false, onDelete: "CASCADE")]
    private ?Space $space = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'members')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\OneToMany(mappedBy: "member", targetEntity: Subscription::class, cascade: ["persist", "remove"])]
    private Collection $subscriptions;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updated_at = null;

    #[Assert\Choice(choices: ['active', 'inactive'], message: "Statut invalide.")]
    #[ORM\Column(length: 20, options: ["default" => "active"])]
    private ?string $status = "active"; // active, inactive

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->created_at = $now;
        $this->updated_at = $now;
        $this->subscriptions = new ArrayCollection();
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

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getRelationship(): ?string
    {
        return $this->relationship;
    }

    public function setRelationship(?string $relationship): static
    {
        if ($relationship !== null && !in_array($relationship, self::RELATION_TYPES, true)) {
            throw new \InvalidArgumentException("Relation invalide.");
        }
        $this->relationship = $relationship;
        return $this;
    }

    public function isParent(): bool
    {
        return $this->relationship === self::RELATION_PARENT;
    }

    public function isChild(): bool
    {
        return $this->relationship === self::RELATION_CHILD;
    }

    public function isPartner(): bool
    {
        return $this->relationship === self::RELATION_PARTNER;
    }

    public function isOther(): bool
    {
        return $this->relationship === self::RELATION_OTHER;
    }

    public function getDateOfBirth(): ?\DateTimeInterface
    {
        return $this->date_of_birth;
    }

    public function setDateOfBirth(?\DateTimeInterface $date_of_birth): static
    {
        $this->date_of_birth = $date_of_birth;
        return $this;
    }

    public function getAge(): ?int
    {
        return $this->calculateAge();
    }

    private function calculateAge(): ?int
    {
        if ($this->date_of_birth === null) {
            return null;
        }
        $today = new \DateTime();
        return $today->diff($this->date_of_birth)->y;
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

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getSubscriptions(): Collection
    {
        return $this->subscriptions;
    }

    public function addSubscription(Subscription $subscription): static
    {
        if (!$this->subscriptions->contains($subscription)) {
            $this->subscriptions->add($subscription);
            $subscription->setMember($this);
        }
        return $this;
    }

    public function removeSubscription(Subscription $subscription): static
    {
        if ($this->subscriptions->removeElement($subscription)) {
            if ($subscription->getMember() === $this) {
                $subscription->setMember(null);
            }
        }
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

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        if (!in_array($status, ['active', 'inactive'], true)) {
            throw new \InvalidArgumentException("Statut invalide.");
        }
        $this->status = $status;
        return $this;
    }

    public function deactivateMember(): static
    {
        $this->status = "inactive";
        $this->updateTimestamps();
        return $this;
    }

    public function activateMember(): static
    {
        $this->status = "active";
        $this->updateTimestamps();
        return $this;
    }

    public function isActive(): bool
    {
        return $this->status === "active";
    }
}
