CREATE TABLE `items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`category` varchar(64) NOT NULL,
	`unit` varchar(32) NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`minStock` int NOT NULL DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `items_id` PRIMARY KEY(`id`),
	CONSTRAINT `items_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `requisitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterName` varchar(128) NOT NULL,
	`area` varchar(64) NOT NULL,
	`itemId` int NOT NULL,
	`quantity` int NOT NULL,
	`justification` text NOT NULL,
	`status` enum('pendente','aprovada','recusada') NOT NULL DEFAULT 'pendente',
	`adminObservation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requisitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`type` enum('entrada','saida') NOT NULL,
	`quantity` int NOT NULL,
	`reason` text NOT NULL,
	`responsible` varchar(128) NOT NULL,
	`requisitionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','solicitante') NOT NULL DEFAULT 'solicitante';