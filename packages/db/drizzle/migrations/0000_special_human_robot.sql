CREATE TABLE IF NOT EXISTS "minigames" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"preview_image" text,
	"publish_type" smallint DEFAULT 0 NOT NULL,
	"terms_of_services" text,
	"privacy_policy" text,
	"proxy_url" text,
	"path_type" smallint DEFAULT 1 NOT NULL,
	"testing_location" text DEFAULT 'usa' NOT NULL,
	"testing_access_code" text NOT NULL,
	"minimum_players_to_start" smallint DEFAULT 1 NOT NULL,
	"supports_mobile" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "packs_minigames" (
	"pack_id" text NOT NULL,
	"minigame_id" text NOT NULL,
	CONSTRAINT "packs_minigames_pack_id_minigame_id_pk" PRIMARY KEY("pack_id","minigame_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "packs" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon_image" text,
	"publish_type" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "servers" (
	"id" varchar(3) PRIMARY KEY NOT NULL,
	"location" text NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"url" text NOT NULL,
	"ws" text,
	"ws_testing" text,
	"ws_discord" text,
	"current_rooms" integer DEFAULT 0 NOT NULL,
	"max_rooms" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"discord_id" text,
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "minigames" ADD CONSTRAINT "minigames_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "packs_minigames" ADD CONSTRAINT "packs_minigames_pack_id_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."packs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "packs_minigames" ADD CONSTRAINT "packs_minigames_minigame_id_minigames_id_fk" FOREIGN KEY ("minigame_id") REFERENCES "public"."minigames"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "packs" ADD CONSTRAINT "packs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
