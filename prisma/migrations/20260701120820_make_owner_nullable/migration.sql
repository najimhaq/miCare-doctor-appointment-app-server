-- AlterTable
ALTER TABLE "Property" ALTER COLUMN "ownerId" DROP NOT NULL;

-- RenameForeignKey
ALTER TABLE "Property" RENAME CONSTRAINT "property_owner_fkey" TO "Property_ownerId_fkey";
