CREATE TABLE `sharedFavorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shareId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`placeIds` text NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sharedFavorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `sharedFavorites_shareId_unique` UNIQUE(`shareId`)
);
