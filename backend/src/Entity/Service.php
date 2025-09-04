<?php

namespace App\Entity;

use App\Repository\ServiceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Doctrine\UuidGenerator;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ServiceRepository::class)]
#[ORM\Table(name: "services")] // Ajout du nom de la table
#[ORM\HasLifecycleCallbacks]
class Service
{
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';

    private const STATUS_TYPES = [self::STATUS_ACTIVE, self::STATUS_INACTIVE];

    #[ORM\Id]
    #[ORM\Column(type: "guid", unique: true)] // Remplacement de "uuid" par "guid"
    #[ORM\GeneratedValue(strategy: "CUSTOM")]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?string $id = null;

    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 255)]
    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[Assert\NotBlank]
    #[Assert\Length(max: 2000)]
    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    #[Assert\Length(max: 255)]
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $provider = null;

    #[Assert\NotBlank]
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $logo = null;

    #[Assert\Url]
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $website = null;

    #[Assert\Choice(choices: self::STATUS_TYPES)]
    #[ORM\Column(length: 20, options: ["default" => self::STATUS_ACTIVE])]
    private ?string $status = self::STATUS_ACTIVE;

    #[Assert\Choice(choices: ["EUR", "USD", "GBP", "CAD", "AUD"], message: "Devise invalide.")]
    #[ORM\Column(length: 3, nullable: false, options: ["default" => "EUR"])]
    private ?string $currency = "EUR";

    #[ORM\ManyToOne(targetEntity: Category::class, inversedBy: "services")]
    #[ORM\JoinColumn(nullable: true, onDelete: "SET NULL")]
    private ?Category $category = null;

    #[ORM\OneToMany(mappedBy: "service", targetEntity: Subscription::class, cascade: ["persist", "remove"])]
    private Collection $subscriptions;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updated_at = null;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->created_at = $now;
        $this->updated_at = $now;
        $this->subscriptions = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $now = new \DateTimeImmutable();
        $this->created_at = $now;
        $this->updated_at = $now;
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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getProvider(): ?string
    {
        return $this->provider;
    }

    public function setProvider(?string $provider): static
    {
        $this->provider = $provider;
        return $this;
    }

    public function getLogo(): ?string
    {
        return $this->logo;
    }

    public function setLogo(string $logo): static
    {
        $this->logo = $logo;
        return $this;
    }

    public function getWebsite(): ?string
    {
        return $this->website;
    }

    public function setWebsite(?string $website): static
    {
        $this->website = $website;
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

    public function activateService(): static
    {
        $this->status = self::STATUS_ACTIVE;
        $this->updated_at = new \DateTimeImmutable();
        return $this;
    }

    public function deactivateService(): static
    {
        $this->status = self::STATUS_INACTIVE;
        $this->updated_at = new \DateTimeImmutable();
        return $this;
    }

    public function getCurrency(): ?string
    {
        return $this->currency;
    }

    public function setCurrency(string $currency): static
    {
        $this->currency = $currency;
        return $this;
    }

    public function getCategory(): ?Category
    {
        return $this->category;
    }

    public function setCategory(?Category $category): static
    {
        $this->category = $category;
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
            $subscription->setService($this);
        }
        return $this;
    }

    public function removeSubscription(Subscription $subscription): static
    {
        if ($this->subscriptions->removeElement($subscription)) {
            if ($subscription->getService() === $this) {
                $subscription->setService(null);
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

    public function setUpdatedAt(\DateTimeImmutable $updated_at): static
    {
        $this->updated_at = $updated_at;
        return $this;
    }

    public function getFullInfo(): string
    {
        return "{$this->name} - {$this->provider} ({$this->website})";
    }
}
