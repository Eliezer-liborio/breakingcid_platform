CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanId` int NOT NULL,
	`content` text NOT NULL,
	`summary` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `reports_scanId_unique` UNIQUE(`scanId`)
);
--> statement-breakpoint
CREATE TABLE `scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scanType` enum('http_smuggling','ssrf','comprehensive') NOT NULL,
	`target` varchar(512) NOT NULL,
	`scope` text,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vulnerabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanId` int NOT NULL,
	`type` varchar(128) NOT NULL,
	`severity` enum('critical','high','medium','low','info') NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`payload` text,
	`evidence` text,
	`remediation` text,
	`cvss` varchar(16),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vulnerabilities_id` PRIMARY KEY(`id`)
);
