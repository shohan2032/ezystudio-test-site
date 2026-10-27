-- Fennel & Fig: table bookings, private dining enquiries, today's specials.
BEGIN;

-- CreateTable
CREATE TABLE "bookings" (
    "id" SERIAL NOT NULL,
    "reference" VARCHAR(12) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "party_size" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "time" VARCHAR(5) NOT NULL,
    "notes" VARCHAR(500) NOT NULL DEFAULT '',
    "status" VARCHAR(12) NOT NULL DEFAULT 'requested',
    "user_id" INTEGER,
    "ip_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(30) NOT NULL DEFAULT '',
    "kind" VARCHAR(20) NOT NULL,
    "guests" INTEGER NOT NULL,
    "event_date" DATE,
    "message" VARCHAR(2000) NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'new',
    "ip_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specials" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300) NOT NULL DEFAULT '',
    "price_cents" INTEGER NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_reference_key" ON "bookings"("reference");

-- CreateIndex
CREATE INDEX "bookings_status_id_idx" ON "bookings"("status", "id");

-- CreateIndex
CREATE INDEX "bookings_date_time_idx" ON "bookings"("date", "time");

-- CreateIndex
CREATE INDEX "bookings_user_id_id_idx" ON "bookings"("user_id", "id");

-- CreateIndex
CREATE INDEX "bookings_ip_hash_created_at_idx" ON "bookings"("ip_hash", "created_at");

-- CreateIndex
CREATE INDEX "enquiries_status_id_idx" ON "enquiries"("status", "id");

-- CreateIndex
CREATE INDEX "enquiries_ip_hash_created_at_idx" ON "enquiries"("ip_hash", "created_at");

-- CreateIndex
CREATE INDEX "specials_available_id_idx" ON "specials"("available", "id");


COMMIT;
