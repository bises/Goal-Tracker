/*
  Warnings:

  - Added the required column `userId` to the `Goal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/

-- 1. Add userId as nullable
ALTER TABLE "Goal" ADD COLUMN "userId" TEXT;
ALTER TABLE "Task" ADD COLUMN "userId" TEXT;

-- 2. Set default userId for existing rows
UPDATE "Goal" SET "userId" = '4ac85d5d8f2c883db1925b4080e632cd873765fb7bc605b5372aa806dbd5d053' WHERE "userId" IS NULL;
UPDATE "Task" SET "userId" = '4ac85d5d8f2c883db1925b4080e632cd873765fb7bc605b5372aa806dbd5d053' WHERE "userId" IS NULL;

-- 3. Make userId required
ALTER TABLE "Goal" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "userId" SET NOT NULL;

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "User_sub_key" ON "User"("sub");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_sub_idx" ON "User"("sub");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
