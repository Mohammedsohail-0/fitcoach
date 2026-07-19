-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "clonedFromId" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WorkoutSplit" ADD COLUMN     "clonedFromId" TEXT;

-- AddForeignKey
ALTER TABLE "WorkoutSplit" ADD CONSTRAINT "WorkoutSplit_clonedFromId_fkey" FOREIGN KEY ("clonedFromId") REFERENCES "WorkoutSplit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_clonedFromId_fkey" FOREIGN KEY ("clonedFromId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
