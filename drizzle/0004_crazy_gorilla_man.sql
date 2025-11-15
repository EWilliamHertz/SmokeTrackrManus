CREATE TABLE `giveaways` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`giveawayDate` timestamp NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`recipient` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `giveaways_id` PRIMARY KEY(`id`)
);
