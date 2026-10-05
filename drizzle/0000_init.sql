CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`image_url` text NOT NULL,
	`blob_pathname` text NOT NULL,
	`score` integer NOT NULL,
	`label` text NOT NULL,
	`expressions` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `uploads_user_id_idx` ON `uploads` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);