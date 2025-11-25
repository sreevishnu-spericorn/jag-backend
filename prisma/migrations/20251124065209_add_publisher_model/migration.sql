-- CreateTable
CREATE TABLE "Publisher" (
    "id" TEXT NOT NULL,
    "publisherName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNo" TEXT,
    "whatsappNo" TEXT,
    "logo" TEXT,
    "w9Files" TEXT[],
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publisher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublisherProduct" (
    "id" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublisherProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_email_key" ON "Publisher"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PublisherProduct_publisherId_productId_key" ON "PublisherProduct"("publisherId", "productId");

-- AddForeignKey
ALTER TABLE "PublisherProduct" ADD CONSTRAINT "PublisherProduct_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublisherProduct" ADD CONSTRAINT "PublisherProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
