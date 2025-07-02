DROP TABLE IF EXISTS "reviews";
CREATE TABLE IF NOT EXISTS "reviews" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    court_id uuid NOT NULL,
    user_id varchar(255) NOT NULL,
    user_name varchar(255) NOT NULL,
    rating integer NOT NULL,
    text varchar(2000),
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);