-- Agent profile expansion + optional Property.agent_id relation

-- 1) Expand Agent fields and make non-essential fields optional
ALTER TABLE "Agent" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "Agent" ADD COLUMN "position" TEXT;
ALTER TABLE "Agent" ADD COLUMN "agency_name" TEXT;
ALTER TABLE "Agent" ADD COLUMN "facebook" TEXT;
ALTER TABLE "Agent" ADD COLUMN "instagram" TEXT;
ALTER TABLE "Agent" ADD COLUMN "linkedin" TEXT;
DO $$ BEGIN
  CREATE TYPE "AgentStatus" AS ENUM ('active', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
ALTER TABLE "Agent" ADD COLUMN "status" "AgentStatus" NOT NULL DEFAULT 'active';

ALTER TABLE "Agent" ALTER COLUMN "photo" DROP NOT NULL;
ALTER TABLE "Agent" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Agent" ALTER COLUMN "bio_en" DROP NOT NULL;
ALTER TABLE "Agent" ALTER COLUMN "bio_fr" DROP NOT NULL;
ALTER TABLE "Agent" ALTER COLUMN "bio_ar" DROP NOT NULL;

-- 2) Make Property.agent_id optional and nullable on agent deletion
ALTER TABLE "Property" DROP CONSTRAINT IF EXISTS "Property_agent_id_fkey";
ALTER TABLE "Property" ALTER COLUMN "agent_id" DROP NOT NULL;
ALTER TABLE "Property"
  ADD CONSTRAINT "Property_agent_id_fkey"
  FOREIGN KEY ("agent_id") REFERENCES "Agent"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
