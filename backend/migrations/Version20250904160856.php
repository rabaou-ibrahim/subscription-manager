<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250904160856 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE categories ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE categories ALTER user_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN categories.id IS NULL');
        $this->addSql('COMMENT ON COLUMN categories.user_id IS NULL');
        $this->addSql('ALTER TABLE invitation ALTER space_id TYPE UUID');
        $this->addSql('ALTER TABLE invitation ALTER invited_by_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN invitation.space_id IS NULL');
        $this->addSql('COMMENT ON COLUMN invitation.invited_by_id IS NULL');
        $this->addSql('ALTER TABLE members ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE members ALTER space_id TYPE UUID');
        $this->addSql('ALTER TABLE members ALTER user_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN members.id IS NULL');
        $this->addSql('COMMENT ON COLUMN members.space_id IS NULL');
        $this->addSql('COMMENT ON COLUMN members.user_id IS NULL');
        $this->addSql('ALTER TABLE notification_targets ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE notification_targets ALTER notification_id TYPE UUID');
        $this->addSql('ALTER TABLE notification_targets ALTER user_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN notification_targets.id IS NULL');
        $this->addSql('COMMENT ON COLUMN notification_targets.notification_id IS NULL');
        $this->addSql('COMMENT ON COLUMN notification_targets.user_id IS NULL');
        $this->addSql('ALTER TABLE notifications ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE notifications ALTER sender_id TYPE UUID');
        $this->addSql('ALTER TABLE notifications ALTER space_id TYPE UUID');
        $this->addSql('ALTER TABLE notifications ALTER receiver_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN notifications.id IS NULL');
        $this->addSql('COMMENT ON COLUMN notifications.sender_id IS NULL');
        $this->addSql('COMMENT ON COLUMN notifications.space_id IS NULL');
        $this->addSql('COMMENT ON COLUMN notifications.receiver_id IS NULL');
        $this->addSql('ALTER TABLE payments ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE payments ALTER subscription_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN payments.id IS NULL');
        $this->addSql('COMMENT ON COLUMN payments.subscription_id IS NULL');
        $this->addSql('ALTER TABLE permissions ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE permissions ALTER user_id TYPE UUID');
        $this->addSql('ALTER TABLE permissions ALTER space_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN permissions.id IS NULL');
        $this->addSql('COMMENT ON COLUMN permissions.user_id IS NULL');
        $this->addSql('COMMENT ON COLUMN permissions.space_id IS NULL');
        $this->addSql('ALTER TABLE services ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE services ALTER category_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN services.id IS NULL');
        $this->addSql('COMMENT ON COLUMN services.category_id IS NULL');
        $this->addSql('ALTER TABLE spaces ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE spaces ALTER created_by_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN spaces.id IS NULL');
        $this->addSql('COMMENT ON COLUMN spaces.created_by_id IS NULL');
        $this->addSql('ALTER TABLE subscription_tags ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE subscription_tags ALTER subscription_id TYPE UUID');
        $this->addSql('ALTER TABLE subscription_tags ALTER tag_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN subscription_tags.id IS NULL');
        $this->addSql('COMMENT ON COLUMN subscription_tags.subscription_id IS NULL');
        $this->addSql('COMMENT ON COLUMN subscription_tags.tag_id IS NULL');
        $this->addSql('ALTER TABLE subscriptions ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE subscriptions ALTER member_id TYPE UUID');
        $this->addSql('ALTER TABLE subscriptions ALTER service_id TYPE UUID');
        $this->addSql('ALTER TABLE subscriptions ALTER user_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN subscriptions.id IS NULL');
        $this->addSql('COMMENT ON COLUMN subscriptions.member_id IS NULL');
        $this->addSql('COMMENT ON COLUMN subscriptions.service_id IS NULL');
        $this->addSql('COMMENT ON COLUMN subscriptions.user_id IS NULL');
        $this->addSql('ALTER TABLE tags ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE tags ALTER user_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN tags.id IS NULL');
        $this->addSql('COMMENT ON COLUMN tags.user_id IS NULL');
        $this->addSql('ALTER TABLE users ALTER id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN users.id IS NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE "users" ALTER id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN "users".id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE notifications ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE notifications ALTER sender_id TYPE UUID');
        $this->addSql('ALTER TABLE notifications ALTER space_id TYPE UUID');
        $this->addSql('ALTER TABLE notifications ALTER receiver_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN notifications.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN notifications.sender_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN notifications.space_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN notifications.receiver_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE permissions ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE permissions ALTER user_id TYPE UUID');
        $this->addSql('ALTER TABLE permissions ALTER space_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN permissions.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN permissions.user_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN permissions.space_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE subscriptions ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE subscriptions ALTER member_id TYPE UUID');
        $this->addSql('ALTER TABLE subscriptions ALTER service_id TYPE UUID');
        $this->addSql('ALTER TABLE subscriptions ALTER user_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN subscriptions.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN subscriptions.member_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN subscriptions.service_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN subscriptions.user_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE invitation ALTER space_id TYPE UUID');
        $this->addSql('ALTER TABLE invitation ALTER invited_by_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN invitation.space_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN invitation.invited_by_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE spaces ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE spaces ALTER created_by_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN spaces.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN spaces.created_by_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE categories ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE categories ALTER user_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN categories.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN categories.user_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE notification_targets ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE notification_targets ALTER notification_id TYPE UUID');
        $this->addSql('ALTER TABLE notification_targets ALTER user_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN notification_targets.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN notification_targets.notification_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN notification_targets.user_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE subscription_tags ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE subscription_tags ALTER subscription_id TYPE UUID');
        $this->addSql('ALTER TABLE subscription_tags ALTER tag_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN subscription_tags.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN subscription_tags.subscription_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN subscription_tags.tag_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE tags ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE tags ALTER user_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN tags.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN tags.user_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE members ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE members ALTER space_id TYPE UUID');
        $this->addSql('ALTER TABLE members ALTER user_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN members.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN members.space_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN members.user_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE services ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE services ALTER category_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN services.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN services.category_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE payments ALTER id TYPE UUID');
        $this->addSql('ALTER TABLE payments ALTER subscription_id TYPE UUID');
        $this->addSql('COMMENT ON COLUMN payments.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN payments.subscription_id IS \'(DC2Type:uuid)\'');
    }
}
