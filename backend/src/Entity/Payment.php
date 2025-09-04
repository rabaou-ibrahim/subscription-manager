<?php

namespace App\Entity;

use App\Repository\PaymentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Doctrine\UuidGenerator;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PaymentRepository::class)]
#[ORM\Table(name: "payments")]
#[ORM\HasLifecycleCallbacks]
class Payment
{
    public const STATUS_PENDING   = 'pending';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED    = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    public const METHOD_CREDIT_CARD   = 'credit_card';
    public const METHOD_PAYPAL        = 'paypal';
    public const METHOD_BANK_TRANSFER = 'bank_transfer';

    private const STATUS_TYPES = [
        self::STATUS_PENDING,
        self::STATUS_COMPLETED,
        self::STATUS_FAILED,
        self::STATUS_CANCELLED,
    ];

    private const PAYMENT_METHODS = [
        self::METHOD_CREDIT_CARD,
        self::METHOD_PAYPAL,
        self::METHOD_BANK_TRANSFER,
    ];

    private const CURRENCY_TYPES = ['EUR', 'USD', 'GBP', 'CAD', 'AUD'];

    #[ORM\Id]
    #[ORM\Column(type: "guid", unique: true)]
    #[ORM\GeneratedValue(strategy: "CUSTOM")]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?string $id = null;

    #[Assert\NotBlank]
    #[Assert\Positive]
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $amount = null; // ⚠️ DECIMAL => string en Doctrine

    #[Assert\NotBlank]
    #[Assert\Choice(choices: self::CURRENCY_TYPES, message: "Devise invalide.")]
    #[ORM\Column(length: 3, nullable: false, options: ["default" => "EUR"])]
    private ?string $currency = "EUR";

    #[Assert\NotBlank]
    #[Assert\Choice(choices: self::PAYMENT_METHODS, message: "Méthode de paiement invalide.")]
    #[ORM\Column(length: 255)]
    private ?string $payment_method = null;

    #[Assert\NotBlank]
    #[Assert\Choice(choices: self::STATUS_TYPES, message: "Statut de paiement invalide.")]
    #[ORM\Column(length: 255, options: ["default" => self::STATUS_PENDING])]
    private ?string $status = self::STATUS_PENDING;

    #[Assert\Length(max: 255)]
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $transaction_id = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updated_at = null;

    #[ORM\ManyToOne(targetEntity: Subscription::class, inversedBy: "payments")]
    #[ORM\JoinColumn(nullable: false, onDelete: "CASCADE")]
    private ?Subscription $subscription = null;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->created_at = $now;
        $this->updated_at = $now;
    }

    #[ORM\PrePersist]
    public function setCreationTimestamps(): void
    {
        $now = new \DateTimeImmutable();
        $this->created_at ??= $now;
        $this->updated_at ??= $now;
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

    public function getAmount(): ?string
    {
        return $this->amount; // renvoie la string "12.34"
    }

    public function setAmount(float|string $amount): self
    {
        // on accepte float ou string et on normalise en "xx.yy"
        $this->amount = number_format((float)$amount, 2, '.', '');
        return $this;
    }

    public function getCurrency(): ?string
    {
        return $this->currency;
    }

    public function setCurrency(string $currency): self
    {
        if (!in_array($currency, self::CURRENCY_TYPES, true)) {
            throw new \InvalidArgumentException("Devise invalide.");
        }
        $this->currency = $currency;
        return $this;
    }

    public function getPaymentMethod(): ?string
    {
        return $this->payment_method;
    }

    public function setPaymentMethod(string $payment_method): self
    {
        if (!in_array($payment_method, self::PAYMENT_METHODS, true)) {
            throw new \InvalidArgumentException("Méthode de paiement invalide.");
        }
        $this->payment_method = $payment_method;
        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        if (!in_array($status, self::STATUS_TYPES, true)) {
            throw new \InvalidArgumentException("Statut de paiement invalide.");
        }
        $this->status = $status;
        return $this;
    }

    public function markAsCompleted(): self
    {
        $this->status = self::STATUS_COMPLETED;
        $this->updateTimestamps();
        return $this;
    }

    public function markAsFailed(): self
    {
        $this->status = self::STATUS_FAILED;
        $this->updateTimestamps();
        return $this;
    }

    public function cancelPayment(): self
    {
        if ($this->status !== self::STATUS_PENDING) {
            throw new \LogicException("Seuls les paiements en attente peuvent être annulés.");
        }
        $this->status = self::STATUS_CANCELLED;
        $this->updateTimestamps();
        return $this;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function getTransactionId(): ?string
    {
        return $this->transaction_id;
    }

    public function setTransactionId(?string $transaction_id): self
    {
        $this->transaction_id = $transaction_id;
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

    public function getSubscription(): ?Subscription
    {
        return $this->subscription;
    }

    public function setSubscription(?Subscription $subscription): self
    {
        if (!$subscription) {
            throw new \InvalidArgumentException("L'abonnement fourni est invalide.");
        }
        $this->subscription = $subscription;
        return $this;
    }
}
