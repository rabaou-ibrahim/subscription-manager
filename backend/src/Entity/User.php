<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Validator\Constraints as Assert;
use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\Doctrine\UuidGenerator;
use Doctrine\DBAL\Types\Types;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: "`users`")] // Éviter les conflits avec le mot réservé "user"
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\Column(type: "guid", unique: true)] // Utilisation de "guid" pour compatibilité avec Doctrine
    #[ORM\GeneratedValue(strategy: "CUSTOM")]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?string $id = null;

    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 255)]
    #[ORM\Column(length: 255)]
    private ?string $lastname = null;

    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 255)]
    #[ORM\Column(length: 255)]
    private ?string $firstname = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $avatar = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $username = null;

    #[ORM\Column(length: 255, unique: true)]
    private ?string $email = null;

    #[Assert\PositiveOrZero]
    #[ORM\Column(nullable: true)]
    private ?int $age = null;

    #[Assert\Regex("/^\+?[0-9]{7,15}$/")]
    #[ORM\Column(length: 50, nullable: true)]
    private ?string $phone_number = null;

    #[Assert\NotBlank]
    #[Assert\Length(min: 8)]
    #[ORM\Column(type: "text")]
    private ?string $password = null;

    #[ORM\Column(type: "boolean", options: ["default" => false])]
    private ?bool $is_active = false;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeInterface $last_login = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $updated_at = null;

    #[ORM\OneToMany(mappedBy: 'sender', targetEntity: Notification::class, orphanRemoval: true)]
    private Collection $notifications;

    #[ORM\OneToMany(mappedBy: "user", targetEntity: Category::class)]
    private Collection $categories;

    #[ORM\OneToMany(mappedBy: "user", targetEntity: NotificationTarget::class)]
    private Collection $notificationTargets;

    #[ORM\OneToMany(mappedBy: "user", targetEntity: Permission::class)]
    private Collection $permissions;

    #[ORM\OneToMany(mappedBy: "user", targetEntity: Member::class)]
    private Collection $members;

    #[ORM\OneToMany(mappedBy: "user", targetEntity: Tag::class)]
    private Collection $tags;

    #[ORM\Column(type: "json")]
    private array $roles = [];

    public function __construct()
    {
        $this->notifications = new ArrayCollection();
        $this->categories = new ArrayCollection();
        $this->notificationTargets = new ArrayCollection();
        $this->permissions = new ArrayCollection();
        $this->members = new ArrayCollection();
        $this->tags = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->created_at = new \DateTimeImmutable();
        $this->updated_at = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updated_at = new \DateTimeImmutable();
    }

    public function getId(): ?string
    {
        return $this->id ? (string) $this->id : null;
    }

    public function getLastname(): ?string
    {
        return $this->lastname;
    }

    public function setLastname(string $lastname): static
    {
        $this->lastname = $lastname;
        return $this;
    }

    public function getFirstname(): ?string
    {
        return $this->firstname;
    }

    public function setFirstname(string $firstname): static
    {
        $this->firstname = $firstname;
        return $this;
    }

    public function getFullName(): string
    {
        return "{$this->firstname} {$this->lastname}";
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(?string $username): static
    {
        $this->username = $username;
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    // public function getRoles(): array
    // {
    //     $roles = $this->roles;
    //     if (!in_array('ROLE_USER', $roles, true)) {
    //         $roles[] = 'ROLE_USER';
    //     }
    //     return $roles;
    // }

    public function getRoles(): array
    {
        return array_unique($this->roles); // Pas d’ajout automatique de ROLE_USER
    }


    // public function setRoles(array $roles): self
    // {
    //     if (!in_array('ROLE_USER', $roles, true)) {
    //         $roles[] = 'ROLE_USER';
    //     }
    //     $this->roles = $roles;
    //     return $this;
    // }
    public function setRoles(array $roles): self
    {
        $this->roles = array_unique($roles);
        return $this;
    }

    public function isAdmin(): bool
    {
        return in_array('ROLE_ADMIN', $this->roles, true);
    }

    public function getAvatar(): ?string
    {
        return $this->avatar;
    }

    public function setAvatar(?string $avatar): static
    {
        $this->avatar = $avatar;
        return $this;
    }

    public function getAge(): ?int
    {
        return $this->age;
    }

    public function setAge(?int $age): static
    {
        $this->age = $age;
        return $this;
    }

    public function getPhoneNumber(): ?string
    {
        return $this->phone_number;
    }

    public function setPhoneNumber(?string $phone_number): static
    {
        $this->phone_number = $phone_number;
        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $hashedPassword): static
    {
        $this->password = $hashedPassword;
        return $this;
    }

    public function isActive(): ?bool
    {
        return $this->is_active;
    }

    public function setIsActive(?bool $is_active): static
    {
        $this->is_active = $is_active;
        return $this;
    }

    public function getLastLogin(): ?\DateTimeInterface
    {
        return $this->last_login;
    }

    public function setLastLogin(?\DateTimeInterface $last_login): static
    {
        $this->last_login = $last_login;
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

    public function eraseCredentials(): void
    {
        // Suppression des données sensibles si nécessaire
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }
}
