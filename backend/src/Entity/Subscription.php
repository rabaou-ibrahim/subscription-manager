<?php

namespace App\Entity;

use App\Repository\SubscriptionRepository;
use App\Entity\User;
use App\Entity\Member;
use App\Entity\Service;
use App\Entity\Payment;
use App\Entity\SubscriptionTag;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Doctrine\UuidGenerator;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: SubscriptionRepository::class)]
#[ORM\Table(name: "subscriptions")]
#[ORM\HasLifecycleCallbacks]
class Subscription
{
    public const STATUS_ACTIVE    = 'active';
    public const STATUS_INACTIVE  = 'inactive';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_EXPIRED   = 'expired';

    private const STATUS_TYPES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_CANCELLED,
        self::STATUS_EXPIRED,
    ];

    #[ORM\Id]
    #[ORM\Column(type: "guid", unique: true)]
    #[ORM\GeneratedValue(strategy: "CUSTOM")]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?string $id = null;

    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 255)]
    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[Assert\Length(max: 2000)]
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $notes = null;

    #[Assert\NotBlank]
    #[ORM\Column(length: 255)]
    private ?string $subscription_type = null;

    #[Assert\NotNull]
    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $start_date = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $end_date = null;

    /** Stocké en DECIMAL(10,2) -> string en PHP */
    #[Assert\PositiveOrZero]
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private string $amount = '0.00';

    #[Assert\Choice(choices: ["EUR", "USD", "GBP", "CAD", "AUD"], message: "Devise invalide.")]
    #[ORM\Column(length: 3, nullable: false, options: ["default" => "EUR"])]
    private ?string $currency = "EUR";

    /** Stocké en DECIMAL(10,2) -> string en PHP */
    #[Assert\PositiveOrZero]
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, options: ['default' => '0.00'])]
    private string $total_paid = '0.00';

    #[ORM\Column(nullable: true)]
    private ?bool $auto_renewal = null;

    #[Assert\NotBlank]
    #[ORM\Column(length: 255)]
    private ?string $billing_mode = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $billing_frequency = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $billing_day = null;

    #[Assert\Choice(choices: self::STATUS_TYPES)]
    #[ORM\Column(length: 255, options: ["default" => self::STATUS_ACTIVE])]
    private ?string $status = self::STATUS_ACTIVE;

    #[ORM\ManyToOne(targetEntity: Member::class, inversedBy: "subscriptions")]
    #[ORM\JoinColumn(nullable: true, onDelete: "CASCADE")]
    private ?Member $member = null;

    #[ORM\ManyToOne(targetEntity: Service::class, inversedBy: "subscriptions")]
    #[ORM\JoinColumn(nullable: false, onDelete: "CASCADE")]
    private ?Service $service = null;

    #[ORM\OneToMany(mappedBy: "subscription", targetEntity: Payment::class, cascade: ["persist", "remove"])]
    private Collection $payments;

    #[ORM\OneToMany(mappedBy: "subscription", targetEntity: SubscriptionTag::class, cascade: ["persist", "remove"])]
    private Collection $subscriptionTags;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updated_at = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: "CASCADE")]
    private ?User $user = null;

    public function __construct()
    {
        $this->payments = new ArrayCollection();
        $this->subscriptionTags = new ArrayCollection();
        $now = new \DateTimeImmutable();
        $this->created_at = $now;
        $this->updated_at = $now;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        if ($this->created_at === null) {
            $this->created_at = new \DateTimeImmutable();
        }
        $this->updated_at = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updated_at = new \DateTimeImmutable();
    }

    // ───── Id ────────────────────────────────────────────────────────────────
    public function getId(): ?string { return $this->id; }

    // ───── Champs simples ───────────────────────────────────────────────────
    public function getName(): ?string { return $this->name; }
    public function setName(?string $name): self { $this->name = $name; return $this; }

    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): self { $this->notes = $notes; return $this; }

    public function getSubscriptionType(): ?string { return $this->subscription_type; }
    public function setSubscriptionType(string $subscription_type): self { $this->subscription_type = $subscription_type; return $this; }

    public function getStartDate(): ?\DateTimeInterface { return $this->start_date; }
    public function setStartDate(\DateTimeInterface $start_date): self { $this->start_date = $start_date; return $this; }

    public function getEndDate(): ?\DateTimeInterface { return $this->end_date; }
    public function setEndDate(?\DateTimeInterface $end_date): self { $this->end_date = $end_date; return $this; }

    public function getCurrency(): ?string { return $this->currency; }
    public function setCurrency(string $currency): self { $this->currency = $currency; return $this; }

    public function getBillingMode(): ?string { return $this->billing_mode; }
    public function setBillingMode(?string $billing_mode): self { $this->billing_mode = $billing_mode; return $this; }

    public function getBillingFrequency(): ?string { return $this->billing_frequency; }
    public function setBillingFrequency(?string $billing_frequency): self { $this->billing_frequency = $billing_frequency; return $this; }

    public function getBillingDay(): ?\DateTimeInterface { return $this->billing_day; }
    public function setBillingDay(?\DateTimeInterface $billing_day): self { $this->billing_day = $billing_day; return $this; }

    public function getAutoRenewal(): ?bool { return $this->auto_renewal; }
    public function setAutoRenewal(?bool $auto_renewal): self { $this->auto_renewal = $auto_renewal; return $this; }

    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): self {
        if (!\in_array($status, self::STATUS_TYPES, true)) {
            throw new \InvalidArgumentException('Statut invalide');
        }
        $this->status = $status;
        return $this;
    }

    // ───── Montants (DECIMAL -> string) + helpers float ─────────────────────
    public function getAmount(): string { return $this->amount; }
    public function getAmountFloat(): float { return (float) $this->amount; }
    public function setAmount(string|float|int $v): self {
        $this->amount = \is_numeric($v) ? number_format((float)$v, 2, '.', '') : (string)$v;
        return $this;
    }

    public function getTotalPaid(): string { return $this->total_paid; }
    public function getTotalPaidFloat(): float { return (float) $this->total_paid; }
    public function setTotalPaid(string|float|int $v): self {
        $this->total_paid = \is_numeric($v) ? number_format((float)$v, 2, '.', '') : (string)$v;
        return $this;
    }

    // ───── Relations ────────────────────────────────────────────────────────
    public function getMember(): ?Member { return $this->member; }
    public function setMember(?Member $member): self { $this->member = $member; return $this; }

    public function getService(): ?Service { return $this->service; }
    public function setService(?Service $service): self { $this->service = $service; return $this; }

    /** @return Collection<int, Payment> */
    public function getPayments(): Collection { return $this->payments; }
    public function addPayment(Payment $payment): self {
        if (!$this->payments->contains($payment)) {
            $this->payments->add($payment);
            $payment->setSubscription($this);
        }
        return $this;
    }
    public function removePayment(Payment $payment): self {
        if ($this->payments->removeElement($payment) && $payment->getSubscription() === $this) {
            $payment->setSubscription(null);
        }
        return $this;
    }

    /** @return Collection<int, SubscriptionTag> */
    public function getSubscriptionTags(): Collection { return $this->subscriptionTags; }
    public function addSubscriptionTag(SubscriptionTag $tag): self {
        if (!$this->subscriptionTags->contains($tag)) {
            $this->subscriptionTags->add($tag);
            $tag->setSubscription($this);
        }
        return $this;
    }
    public function removeSubscriptionTag(SubscriptionTag $tag): self {
        if ($this->subscriptionTags->removeElement($tag) && $tag->getSubscription() === $this) {
            $tag->setSubscription(null);
        }
        return $this;
    }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): self { $this->user = $user; return $this; }

    // ───── Timestamps ───────────────────────────────────────────────────────
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->created_at; }
    public function setCreatedAt(\DateTimeImmutable $created_at): self { $this->created_at = $created_at; return $this; }

    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updated_at; }
    public function setUpdatedAt(\DateTimeImmutable $updated_at): self { $this->updated_at = $updated_at; return $this; }
}
