-- CreateIndex
CREATE INDEX "Task_scheduledDate_isCompleted_idx" ON "Task"("scheduledDate", "isCompleted");

-- CreateIndex
CREATE INDEX "Task_isCompleted_idx" ON "Task"("isCompleted");
