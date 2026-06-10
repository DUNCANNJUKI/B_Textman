-- ============================================================
-- My_mysql db  —  MySQL 8.0 schema for the B TEXTMAN gateway
-- Mirrors the public schema of the Supabase Postgres project.
-- Charset: utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

CREATE DATABASE IF NOT EXISTS `My_mysql_db`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `My_mysql_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------- clients ----------
CREATE TABLE `clients` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `owner_user_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `monthly_quota` INT NOT NULL DEFAULT 10000,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_clients_owner` (`owner_user_id`)
) ENGINE=InnoDB;

-- ---------- profiles ----------
CREATE TABLE `profiles` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `display_name` VARCHAR(255) NULL,
  `company` VARCHAR(255) NULL,
  `avatar_url` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_profiles_user` (`user_id`)
) ENGINE=InnoDB;

-- ---------- user_roles ----------
CREATE TABLE `user_roles` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `role` ENUM('super_admin','admin','client_user') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_role` (`user_id`, `role`)
) ENGINE=InnoDB;

-- ---------- devices ----------
CREATE TABLE `devices` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `client_id` CHAR(36) NULL,
  `device_name` VARCHAR(255) NOT NULL,
  `device_token` VARCHAR(128) NOT NULL,
  `phone_number` VARCHAR(32) NULL,
  `sim_operator` VARCHAR(64) NULL,
  `sim_slot` INT NULL DEFAULT 1,
  `android_version` VARCHAR(32) NULL,
  `app_version` VARCHAR(32) NULL,
  `battery_level` INT DEFAULT 0,
  `signal_strength` INT DEFAULT 0,
  `internet_type` VARCHAR(32) NULL,
  `ip_address` VARCHAR(64) NULL,
  `status` ENUM('online','offline','sending','disabled') NOT NULL DEFAULT 'offline',
  `last_seen` TIMESTAMP NULL,
  `total_sms_sent` BIGINT NOT NULL DEFAULT 0,
  `total_sms_failed` BIGINT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_device_token` (`device_token`),
  KEY `idx_devices_client` (`client_id`),
  CONSTRAINT `fk_devices_client` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- device_logs ----------
CREATE TABLE `device_logs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `device_id` CHAR(36) NOT NULL,
  `event_type` VARCHAR(64) NOT NULL,
  `payload` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_device_logs_device` (`device_id`),
  CONSTRAINT `fk_device_logs_device` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- messages ----------
CREATE TABLE `messages` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `client_id` CHAR(36) NOT NULL,
  `device_id` CHAR(36) NULL,
  `recipient` VARCHAR(32) NOT NULL,
  `message` TEXT NOT NULL,
  `encoding` VARCHAR(16) NOT NULL DEFAULT 'GSM7',
  `parts_count` INT NOT NULL DEFAULT 1,
  `priority` INT NOT NULL DEFAULT 5,
  `status` ENUM('queued','processing','sent','delivered','failed','cancelled') NOT NULL DEFAULT 'queued',
  `external_reference` VARCHAR(128) NULL,
  `error_message` TEXT NULL,
  `provider_response` JSON NULL,
  `retry_count` INT NOT NULL DEFAULT 0,
  `max_retries` INT NOT NULL DEFAULT 3,
  `processing_at` TIMESTAMP NULL,
  `sent_at` TIMESTAMP NULL,
  `delivered_at` TIMESTAMP NULL,
  `failed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_client_status` (`client_id`,`status`),
  KEY `idx_messages_device` (`device_id`),
  KEY `idx_messages_status_created` (`status`,`created_at`),
  CONSTRAINT `fk_messages_client` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_device` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- message_events ----------
CREATE TABLE `message_events` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `message_id` CHAR(36) NOT NULL,
  `event_type` VARCHAR(64) NOT NULL,
  `payload` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_message_events_msg` (`message_id`),
  CONSTRAINT `fk_message_events_message` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- bulk_campaigns ----------
CREATE TABLE `bulk_campaigns` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `client_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `message_template` TEXT NOT NULL,
  `status` ENUM('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  `total_count` INT NOT NULL DEFAULT 0,
  `sent_count` INT NOT NULL DEFAULT 0,
  `failed_count` INT NOT NULL DEFAULT 0,
  `scheduled_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_campaigns_client` (`client_id`),
  CONSTRAINT `fk_campaigns_client` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- api_keys ----------
CREATE TABLE `api_keys` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `client_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `key_prefix` VARCHAR(32) NOT NULL,
  `key_hash` CHAR(64) NOT NULL,
  `status` ENUM('active','revoked','expired') NOT NULL DEFAULT 'active',
  `rate_limit` INT NOT NULL DEFAULT 60,
  `usage_count` BIGINT NOT NULL DEFAULT 0,
  `last_used_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_api_key_hash` (`key_hash`),
  KEY `idx_api_keys_client` (`client_id`),
  CONSTRAINT `fk_api_keys_client` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- api_key_request_logs ----------
CREATE TABLE `api_key_request_logs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `api_key_id` CHAR(36) NOT NULL,
  `client_id` CHAR(36) NOT NULL,
  `device_id` CHAR(36) NULL,
  `device_name` VARCHAR(255) NULL,
  `endpoint_path` VARCHAR(255) NOT NULL,
  `request_method` VARCHAR(8) NOT NULL DEFAULT 'POST',
  `ip_address` VARCHAR(64) NULL,
  `user_agent` TEXT NULL,
  `status_code` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_apilogs_key` (`api_key_id`),
  KEY `idx_apilogs_client_time` (`client_id`,`created_at`),
  CONSTRAINT `fk_apilogs_key` FOREIGN KEY (`api_key_id`) REFERENCES `api_keys`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- webhooks ----------
CREATE TABLE `webhooks` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `client_id` CHAR(36) NOT NULL,
  `url` TEXT NOT NULL,
  `secret` VARCHAR(128) NOT NULL,
  `events` JSON NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `failure_count` INT NOT NULL DEFAULT 0,
  `last_status` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_webhooks_client` (`client_id`),
  CONSTRAINT `fk_webhooks_client` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- webhook_deliveries ----------
CREATE TABLE `webhook_deliveries` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `webhook_id` CHAR(36) NOT NULL,
  `message_id` CHAR(36) NULL,
  `event_type` VARCHAR(64) NOT NULL,
  `target_url` TEXT NULL,
  `payload` JSON NOT NULL,
  `request_body` JSON NULL,
  `request_headers` JSON NOT NULL,
  `response_headers` JSON NOT NULL,
  `response_status` INT NULL,
  `response_body` TEXT NULL,
  `request_signature` VARCHAR(128) NULL,
  `duration_ms` INT NULL,
  `attempt` INT NOT NULL DEFAULT 1,
  `succeeded` TINYINT(1) NOT NULL DEFAULT 0,
  `delivered_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_deliveries_webhook_time` (`webhook_id`,`created_at`),
  CONSTRAINT `fk_deliveries_webhook` FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- settings ----------
CREATE TABLE `settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `key` VARCHAR(128) NOT NULL,
  `value` JSON NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_settings_key` (`key`)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
-- End of My_mysql db
