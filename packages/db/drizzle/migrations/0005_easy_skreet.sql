ALTER TABLE "minigames" ADD COLUMN "under_review" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "minigames" ADD COLUMN "can_publish" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "minigames" ADD COLUMN "published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "minigames" ADD COLUMN "official" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "minigames" ADD COLUMN "previously_featured_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "minigames" DROP COLUMN "publish_type";