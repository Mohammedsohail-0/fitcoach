-- CreateTable
CREATE TABLE "BodyWeightLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyWeightLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BodyWeightLog" ADD CONSTRAINT "BodyWeightLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
