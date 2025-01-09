-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "latestSystemPromptId" INTEGER NOT NULL,
    "latestUserPromptId" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "systemPrompts" (
    "id" SERIAL NOT NULL,
    "prompt" TEXT NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "systemPrompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userPrompts" (
    "id" SERIAL NOT NULL,
    "prompt" TEXT NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "userPrompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatResults" (
    "id" SERIAL NOT NULL,
    "results" TEXT NOT NULL,
    "systemPromptId" INTEGER NOT NULL,
    "userPromptId" INTEGER NOT NULL,

    CONSTRAINT "chatResults_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "systemPrompts" ADD CONSTRAINT "systemPrompts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userPrompts" ADD CONSTRAINT "userPrompts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatResults" ADD CONSTRAINT "chatResults_systemPromptId_fkey" FOREIGN KEY ("systemPromptId") REFERENCES "systemPrompts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatResults" ADD CONSTRAINT "chatResults_userPromptId_fkey" FOREIGN KEY ("userPromptId") REFERENCES "userPrompts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
