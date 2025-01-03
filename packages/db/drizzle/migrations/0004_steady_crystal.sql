DROP TABLE "packs_minigames" CASCADE;--> statement-breakpoint
DROP TABLE "packs" CASCADE;--> statement-breakpoint
ALTER TABLE "minigames" ADD COLUMN "currently_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "minigames" DROP COLUMN "publically_addable_to_pack";