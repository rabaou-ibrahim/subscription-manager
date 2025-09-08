<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250906135427 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE categories (id UUID NOT NULL, user_id UUID DEFAULT NULL, name VARCHAR(255) NOT NULL, is_default BOOLEAN DEFAULT false NOT NULL, description TEXT DEFAULT NULL, color VARCHAR(7) NOT NULL, icon VARCHAR(255) DEFAULT NULL, type VARCHAR(255) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_3AF34668A76ED395 ON categories (user_id)');
        $this->addSql('COMMENT ON COLUMN categories.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN categories.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE invitation (id SERIAL NOT NULL, space_id UUID NOT NULL, invited_by_id UUID DEFAULT NULL, email VARCHAR(180) NOT NULL, relationship VARCHAR(24) NOT NULL, date_of_birth TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, token VARCHAR(96) NOT NULL, status VARCHAR(16) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, expires_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_F11D61A25F37A13B ON invitation (token)');
        $this->addSql('CREATE INDEX IDX_F11D61A223575340 ON invitation (space_id)');
        $this->addSql('CREATE INDEX IDX_F11D61A2A7B4A7E3 ON invitation (invited_by_id)');
        $this->addSql('COMMENT ON COLUMN invitation.date_of_birth IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN invitation.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN invitation.expires_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE members (id UUID NOT NULL, space_id UUID NOT NULL, user_id UUID NOT NULL, name VARCHAR(255) NOT NULL, relationship VARCHAR(255) DEFAULT NULL, date_of_birth DATE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, status VARCHAR(20) DEFAULT \'active\' NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_45A0D2FF23575340 ON members (space_id)');
        $this->addSql('CREATE INDEX IDX_45A0D2FFA76ED395 ON members (user_id)');
        $this->addSql('COMMENT ON COLUMN members.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN members.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE notification_targets (id UUID NOT NULL, notification_id UUID NOT NULL, user_id UUID NOT NULL, read_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, status VARCHAR(20) DEFAULT \'pending\' NOT NULL, is_important BOOLEAN DEFAULT false NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_BA5D94A4EF1A9D84 ON notification_targets (notification_id)');
        $this->addSql('CREATE INDEX IDX_BA5D94A4A76ED395 ON notification_targets (user_id)');
        $this->addSql('COMMENT ON COLUMN notification_targets.read_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN notification_targets.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN notification_targets.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE notifications (id UUID NOT NULL, sender_id UUID DEFAULT NULL, space_id UUID DEFAULT NULL, receiver_id UUID NOT NULL, notification_type VARCHAR(255) NOT NULL, message TEXT NOT NULL, sent_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, status VARCHAR(20) DEFAULT \'pending\' NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_6000B0D3F624B39D ON notifications (sender_id)');
        $this->addSql('CREATE INDEX IDX_6000B0D323575340 ON notifications (space_id)');
        $this->addSql('CREATE INDEX IDX_6000B0D3CD53EDB6 ON notifications (receiver_id)');
        $this->addSql('COMMENT ON COLUMN notifications.sent_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN notifications.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN notifications.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE payments (id UUID NOT NULL, subscription_id UUID NOT NULL, amount NUMERIC(10, 2) NOT NULL, currency VARCHAR(3) DEFAULT \'EUR\' NOT NULL, payment_method VARCHAR(255) NOT NULL, status VARCHAR(255) DEFAULT \'pending\' NOT NULL, transaction_id VARCHAR(255) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_65D29B329A1887DC ON payments (subscription_id)');
        $this->addSql('COMMENT ON COLUMN payments.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN payments.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE permissions (id UUID NOT NULL, user_id UUID NOT NULL, space_id UUID DEFAULT NULL, permission_type VARCHAR(255) NOT NULL, assigned_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, status VARCHAR(20) DEFAULT \'active\' NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_2DEDCC6FA76ED395 ON permissions (user_id)');
        $this->addSql('CREATE INDEX IDX_2DEDCC6F23575340 ON permissions (space_id)');
        $this->addSql('COMMENT ON COLUMN permissions.assigned_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN permissions.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE services (id UUID NOT NULL, category_id UUID DEFAULT NULL, name VARCHAR(255) NOT NULL, description TEXT NOT NULL, provider VARCHAR(255) DEFAULT NULL, logo VARCHAR(255) DEFAULT NULL, website VARCHAR(255) DEFAULT NULL, status VARCHAR(20) DEFAULT \'active\' NOT NULL, currency VARCHAR(3) DEFAULT \'EUR\' NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_7332E16912469DE2 ON services (category_id)');
        $this->addSql('COMMENT ON COLUMN services.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN services.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE spaces (id UUID NOT NULL, created_by_id UUID NOT NULL, name VARCHAR(255) NOT NULL, logo VARCHAR(255) DEFAULT NULL, description TEXT DEFAULT NULL, status VARCHAR(20) DEFAULT \'active\' NOT NULL, visibility VARCHAR(20) DEFAULT \'private\' NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_DD2B6478B03A8386 ON spaces (created_by_id)');
        $this->addSql('COMMENT ON COLUMN spaces.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN spaces.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE subscription_tags (id UUID NOT NULL, subscription_id UUID NOT NULL, tag_id UUID NOT NULL, status VARCHAR(20) DEFAULT \'active\' NOT NULL, read_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_588084389A1887DC ON subscription_tags (subscription_id)');
        $this->addSql('CREATE INDEX IDX_58808438BAD26311 ON subscription_tags (tag_id)');
        $this->addSql('COMMENT ON COLUMN subscription_tags.read_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN subscription_tags.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN subscription_tags.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE subscriptions (id UUID NOT NULL, member_id UUID DEFAULT NULL, service_id UUID NOT NULL, user_id UUID NOT NULL, name VARCHAR(255) NOT NULL, notes TEXT DEFAULT NULL, subscription_type VARCHAR(255) NOT NULL, start_date DATE NOT NULL, end_date DATE DEFAULT NULL, amount NUMERIC(10, 2) NOT NULL, currency VARCHAR(3) DEFAULT \'EUR\' NOT NULL, total_paid NUMERIC(10, 2) DEFAULT \'0.00\' NOT NULL, auto_renewal BOOLEAN DEFAULT NULL, billing_mode VARCHAR(255) NOT NULL, billing_frequency VARCHAR(255) DEFAULT NULL, billing_day DATE DEFAULT NULL, status VARCHAR(255) DEFAULT \'active\' NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_4778A017597D3FE ON subscriptions (member_id)');
        $this->addSql('CREATE INDEX IDX_4778A01ED5CA9E6 ON subscriptions (service_id)');
        $this->addSql('CREATE INDEX IDX_4778A01A76ED395 ON subscriptions (user_id)');
        $this->addSql('COMMENT ON COLUMN subscriptions.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN subscriptions.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE tags (id UUID NOT NULL, user_id UUID DEFAULT NULL, name VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, color VARCHAR(7) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, status VARCHAR(20) DEFAULT \'active\' NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_6FBC9426A76ED395 ON tags (user_id)');
        $this->addSql('COMMENT ON COLUMN tags.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN tags.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE "users" (id UUID NOT NULL, lastname VARCHAR(255) NOT NULL, firstname VARCHAR(255) NOT NULL, avatar VARCHAR(255) DEFAULT NULL, username VARCHAR(255) DEFAULT NULL, email VARCHAR(255) NOT NULL, age INT DEFAULT NULL, phone_number VARCHAR(50) DEFAULT NULL, password TEXT NOT NULL, is_active BOOLEAN DEFAULT false NOT NULL, last_login TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, roles JSON NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1483A5E9E7927C74 ON "users" (email)');
        $this->addSql('COMMENT ON COLUMN "users".last_login IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN "users".created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN "users".updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE categories ADD CONSTRAINT FK_3AF34668A76ED395 FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE invitation ADD CONSTRAINT FK_F11D61A223575340 FOREIGN KEY (space_id) REFERENCES spaces (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE invitation ADD CONSTRAINT FK_F11D61A2A7B4A7E3 FOREIGN KEY (invited_by_id) REFERENCES "users" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE members ADD CONSTRAINT FK_45A0D2FF23575340 FOREIGN KEY (space_id) REFERENCES spaces (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE members ADD CONSTRAINT FK_45A0D2FFA76ED395 FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE notification_targets ADD CONSTRAINT FK_BA5D94A4EF1A9D84 FOREIGN KEY (notification_id) REFERENCES notifications (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE notification_targets ADD CONSTRAINT FK_BA5D94A4A76ED395 FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE notifications ADD CONSTRAINT FK_6000B0D3F624B39D FOREIGN KEY (sender_id) REFERENCES "users" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE notifications ADD CONSTRAINT FK_6000B0D323575340 FOREIGN KEY (space_id) REFERENCES spaces (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE notifications ADD CONSTRAINT FK_6000B0D3CD53EDB6 FOREIGN KEY (receiver_id) REFERENCES "users" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE payments ADD CONSTRAINT FK_65D29B329A1887DC FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE permissions ADD CONSTRAINT FK_2DEDCC6FA76ED395 FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE permissions ADD CONSTRAINT FK_2DEDCC6F23575340 FOREIGN KEY (space_id) REFERENCES spaces (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE services ADD CONSTRAINT FK_7332E16912469DE2 FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE spaces ADD CONSTRAINT FK_DD2B6478B03A8386 FOREIGN KEY (created_by_id) REFERENCES "users" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE subscription_tags ADD CONSTRAINT FK_588084389A1887DC FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE subscription_tags ADD CONSTRAINT FK_58808438BAD26311 FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE subscriptions ADD CONSTRAINT FK_4778A017597D3FE FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE subscriptions ADD CONSTRAINT FK_4778A01ED5CA9E6 FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE subscriptions ADD CONSTRAINT FK_4778A01A76ED395 FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE tags ADD CONSTRAINT FK_6FBC9426A76ED395 FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE categories DROP CONSTRAINT FK_3AF34668A76ED395');
        $this->addSql('ALTER TABLE invitation DROP CONSTRAINT FK_F11D61A223575340');
        $this->addSql('ALTER TABLE invitation DROP CONSTRAINT FK_F11D61A2A7B4A7E3');
        $this->addSql('ALTER TABLE members DROP CONSTRAINT FK_45A0D2FF23575340');
        $this->addSql('ALTER TABLE members DROP CONSTRAINT FK_45A0D2FFA76ED395');
        $this->addSql('ALTER TABLE notification_targets DROP CONSTRAINT FK_BA5D94A4EF1A9D84');
        $this->addSql('ALTER TABLE notification_targets DROP CONSTRAINT FK_BA5D94A4A76ED395');
        $this->addSql('ALTER TABLE notifications DROP CONSTRAINT FK_6000B0D3F624B39D');
        $this->addSql('ALTER TABLE notifications DROP CONSTRAINT FK_6000B0D323575340');
        $this->addSql('ALTER TABLE notifications DROP CONSTRAINT FK_6000B0D3CD53EDB6');
        $this->addSql('ALTER TABLE payments DROP CONSTRAINT FK_65D29B329A1887DC');
        $this->addSql('ALTER TABLE permissions DROP CONSTRAINT FK_2DEDCC6FA76ED395');
        $this->addSql('ALTER TABLE permissions DROP CONSTRAINT FK_2DEDCC6F23575340');
        $this->addSql('ALTER TABLE services DROP CONSTRAINT FK_7332E16912469DE2');
        $this->addSql('ALTER TABLE spaces DROP CONSTRAINT FK_DD2B6478B03A8386');
        $this->addSql('ALTER TABLE subscription_tags DROP CONSTRAINT FK_588084389A1887DC');
        $this->addSql('ALTER TABLE subscription_tags DROP CONSTRAINT FK_58808438BAD26311');
        $this->addSql('ALTER TABLE subscriptions DROP CONSTRAINT FK_4778A017597D3FE');
        $this->addSql('ALTER TABLE subscriptions DROP CONSTRAINT FK_4778A01ED5CA9E6');
        $this->addSql('ALTER TABLE subscriptions DROP CONSTRAINT FK_4778A01A76ED395');
        $this->addSql('ALTER TABLE tags DROP CONSTRAINT FK_6FBC9426A76ED395');
        $this->addSql('DROP TABLE categories');
        $this->addSql('DROP TABLE invitation');
        $this->addSql('DROP TABLE members');
        $this->addSql('DROP TABLE notification_targets');
        $this->addSql('DROP TABLE notifications');
        $this->addSql('DROP TABLE payments');
        $this->addSql('DROP TABLE permissions');
        $this->addSql('DROP TABLE services');
        $this->addSql('DROP TABLE spaces');
        $this->addSql('DROP TABLE subscription_tags');
        $this->addSql('DROP TABLE subscriptions');
        $this->addSql('DROP TABLE tags');
        $this->addSql('DROP TABLE "users"');
    }
}
