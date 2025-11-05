CREATE TABLE IF NOT EXISTS "waiting_list" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "waiting_list_pkey" PRIMARY KEY ("id")
);


