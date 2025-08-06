CREATE TABLE "user_bans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"user_name" varchar(255) NOT NULL,
	"user_email" varchar(255),
	"banned_by" varchar(255) NOT NULL,
	"banned_by_user_name" varchar(255) NOT NULL,
	"ban_reason" varchar(500) NOT NULL,
	"ban_type" varchar(50) DEFAULT 'full' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
