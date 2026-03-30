import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1711800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable PostGIS extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    // Create role enum
    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE')
    `);

    // Create attendance enums
    await queryRunner.query(`
      CREATE TYPE "attendance_status" AS ENUM ('CHECKED_IN', 'CHECKED_OUT')
    `);
    await queryRunner.query(`
      CREATE TYPE "check_in_method" AS ENUM ('WIFI', 'GPS')
    `);

    // ========== BRANCHES ==========
    await queryRunner.query(`
      CREATE TABLE "branches" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "address" varchar(500) NOT NULL,
        "latitude" double precision NOT NULL,
        "longitude" double precision NOT NULL,
        "location" geography(Point, 4326),
        "radius_m" int NOT NULL DEFAULT 50,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Spatial index on location
    await queryRunner.query(`
      CREATE INDEX "IDX_branches_location" ON "branches" USING GIST ("location")
    `);

    // ========== DEPARTMENTS ==========
    await queryRunner.query(`
      CREATE TABLE "departments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "branch_id" uuid NOT NULL REFERENCES "branches"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // ========== USERS ==========
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(100) NOT NULL,
        "role" "user_role" NOT NULL DEFAULT 'EMPLOYEE',
        "branch_id" uuid REFERENCES "branches"("id") ON DELETE SET NULL,
        "department_id" uuid REFERENCES "departments"("id") ON DELETE SET NULL,
        "device_id" varchar(255),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_branch" ON "users" ("branch_id")
    `);

    // ========== BRANCH_WIFI ==========
    await queryRunner.query(`
      CREATE TABLE "branch_wifi" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "branch_id" uuid NOT NULL REFERENCES "branches"("id") ON DELETE CASCADE,
        "bssid" varchar(17) NOT NULL,
        "description" varchar(200),
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_branch_wifi_branch_bssid"
        ON "branch_wifi" ("branch_id", "bssid")
    `);

    // ========== ATTENDANCE ==========
    await queryRunner.query(`
      CREATE TABLE "attendance" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "branch_id" uuid NOT NULL REFERENCES "branches"("id") ON DELETE CASCADE,
        "check_in_at" timestamptz NOT NULL,
        "check_out_at" timestamptz,
        "status" "attendance_status" NOT NULL DEFAULT 'CHECKED_IN',
        "method" "check_in_method" NOT NULL,
        "distance_m" double precision,
        "bssid" varchar(17),
        "device_id" varchar(255),
        "user_agent" text,
        "ip_address" varchar(45),
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Fast "today's active check-in" lookup for morning peak
    await queryRunner.query(`
      CREATE INDEX "IDX_attendance_user_checkin"
        ON "attendance" ("user_id", "check_in_at" DESC)
        WHERE "status" = 'CHECKED_IN'
    `);

    // Branch report queries
    await queryRunner.query(`
      CREATE INDEX "IDX_attendance_branch_checkin"
        ON "attendance" ("branch_id", "check_in_at")
    `);

    // ========== ATTENDANCE_AUDIT_LOG ==========
    await queryRunner.query(`
      CREATE TABLE "attendance_audit_log" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "branch_id" uuid NOT NULL REFERENCES "branches"("id") ON DELETE CASCADE,
        "reason" varchar(50) NOT NULL,
        "detail" text,
        "latitude" double precision,
        "longitude" double precision,
        "bssid" varchar(17),
        "device_id" varchar(255),
        "user_agent" text,
        "ip_address" varchar(45),
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_log_user_created"
        ON "attendance_audit_log" ("user_id", "created_at" DESC)
    `);

    // ========== TRIGGER: auto-update location from lat/lng ==========
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_branch_location()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER "trg_branches_location"
      BEFORE INSERT OR UPDATE OF latitude, longitude ON "branches"
      FOR EACH ROW EXECUTE FUNCTION update_branch_location()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_branches_location" ON "branches"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_branch_location()`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_audit_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "branch_wifi"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "departments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "branches"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "check_in_method"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "attendance_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);
  }
}
