-- CreateTable
CREATE TABLE "Menu" (
    "id" UUID NOT NULL,
    "menuName" VARCHAR(100) NOT NULL,
    "parentId" UUID,
    "urlPath" VARCHAR(255),
    "filePath" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isSystemAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterCode" (
    "code" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterCode_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Code" (
    "code" VARCHAR(50) NOT NULL,
    "masterCode" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(100) NOT NULL,
    "codeValue" VARCHAR(100),
    "description" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Code_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "Menu_parentId_idx" ON "Menu"("parentId");

-- CreateIndex
CREATE INDEX "Menu_sortOrder_idx" ON "Menu"("sortOrder");

-- CreateIndex
CREATE INDEX "Code_masterCode_idx" ON "Code"("masterCode");

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Code" ADD CONSTRAINT "Code_masterCode_fkey" FOREIGN KEY ("masterCode") REFERENCES "MasterCode"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
