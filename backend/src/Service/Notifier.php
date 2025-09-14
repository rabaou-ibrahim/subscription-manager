<?php

// src/Service/Notifier.php
namespace App\Service;

use App\Entity\Notification;
use App\Entity\Space;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class Notifier
{
    public function __construct(private EntityManagerInterface $em) {}

    /**
     * Notif générique
     */
    public function toUser(
        User $receiver,
        string $message,
        string $type = Notification::TYPE_INFO,
        ?User $sender = null,
        ?Space $space = null
    ): Notification {
        $n = (new Notification())
            ->setReceiver($receiver)
            ->setMessage($message)
            ->setNotificationType($type)
            ->setSender($sender)
            ->setSpace($space)
            ->setStatus(Notification::STATUS_PENDING); // non-lu par défaut

        $this->em->persist($n);
        $this->em->flush();

        return $n;
    }

    /**
     * Cas métier : un membre existant est ajouté à un espace
     */
    public function memberAdded(User $receiver, Space $space, ?User $by = null): Notification
    {
        $who = $by?->getFullName() ?: $by?->getEmail() ?: 'Quelqu\'un';
        $msg = sprintf('%s vous a ajouté à l’espace « %s ».', $who, $space->getName());
        return $this->toUser($receiver, $msg, Notification::TYPE_INFO, $by, $space);
    }

    /**
     * Cas métier : invitation envoyée (pour le créateur, pas l’invité)
     * (l’invité n’a pas de compte → pas de Notification côté app)
     */
    public function inviteSent(User $receiver, Space $space, string $email, ?User $by = null): Notification
    {
        $msg = sprintf('Invitation envoyée à %s pour rejoindre « %s ».', $email, $space->getName());
        return $this->toUser($receiver, $msg, Notification::TYPE_INFO, $by, $space);
    }
}


?>