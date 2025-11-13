ALTER TABLE `consumption` MODIFY COLUMN `quantity` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `startDate` timestamp;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `dashboardLayout` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `shareToken` varchar(64);--> statement-breakpoint
ALTER TABLE `userSettings` ADD CONSTRAINT `userSettings_shareToken_unique` UNIQUE(`shareToken`);