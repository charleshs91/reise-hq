CREATE TABLE `candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`search_id` text NOT NULL,
	`label` text NOT NULL,
	`stops` text NOT NULL,
	FOREIGN KEY (`search_id`) REFERENCES `searches`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "candidates_stops" CHECK("candidates"."stops" in ('direct', 'one-stop', 'two-plus'))
);
--> statement-breakpoint
CREATE INDEX `candidates_search` ON `candidates` (`search_id`);--> statement-breakpoint
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `places` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`city` text,
	`country` text NOT NULL,
	`type` text,
	`search_text` text NOT NULL,
	CONSTRAINT "places_kind" CHECK("places"."kind" in ('airport', 'citySlug'))
);
--> statement-breakpoint
CREATE TABLE `price_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`amount` real NOT NULL,
	`observed_at` text NOT NULL,
	`remark` text,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "price_observations_amount" CHECK("price_observations"."amount" > 0)
);
--> statement-breakpoint
CREATE INDEX `price_observations_candidate` ON `price_observations` (`candidate_id`);--> statement-breakpoint
CREATE TABLE `searches` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`origin_id` text NOT NULL,
	`destination_id` text NOT NULL,
	`departure_date` text NOT NULL,
	`return_date` text,
	`currency` text NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`origin_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destination_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "searches_return_after_departure" CHECK("searches"."return_date" is null or "searches"."return_date" >= "searches"."departure_date")
);
--> statement-breakpoint
CREATE INDEX `searches_trip` ON `searches` (`trip_id`);--> statement-breakpoint
CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
