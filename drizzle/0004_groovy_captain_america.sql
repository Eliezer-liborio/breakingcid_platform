CREATE TABLE `scanLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanId` int NOT NULL,
	`message` text NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scanLogs_id` PRIMARY KEY(`id`)
);
