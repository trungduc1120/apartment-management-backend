-- CreateEnum
CREATE TYPE "State" AS ENUM ('INACTIVE', 'ACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "HouseHoldStatus" AS ENUM ('ACTIVE', 'MOVED', 'DELETE');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('ACTIVE', 'PAUSED', 'STOPPED');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('ONE_TIME', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "FeeCalculationBase" AS ENUM ('PER_PERSON', 'PER_HOUSEHOLD', 'PER_MOTORBIKE', 'PER_CAR');

-- CreateEnum
CREATE TYPE "ResidenceStatus" AS ENUM ('NORMAL', 'TEMP_ABSENT', 'TEMP_RESIDENT', 'MOVE_OUT');

-- CreateEnum
CREATE TYPE "InformationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DELETING', 'ENDED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "RelationshipToHead" AS ENUM ('HEAD', 'WIFE', 'HUSBAND', 'SON', 'DAUGHTER', 'FATHER', 'MOTHER', 'OTHER');

-- CreateEnum
CREATE TYPE "Actions" AS ENUM ('CREATE', 'DELETE', 'UPDATE');

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createtime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "householdId" INTEGER,
    "state" "State" NOT NULL DEFAULT 'INACTIVE',

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseHolds" (
    "id" SERIAL NOT NULL,
    "houseHoldCode" INTEGER NOT NULL,
    "apartmentNumber" TEXT NOT NULL,
    "buildingNumber" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "status" "HouseHoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "numCars" INTEGER NOT NULL DEFAULT 0,
    "numMotorbike" INTEGER NOT NULL DEFAULT 0,
    "informationStatus" "InformationStatus" NOT NULL DEFAULT 'PENDING',
    "createtime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "headID" INTEGER NOT NULL,
    "userID" INTEGER,

    CONSTRAINT "HouseHolds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" SERIAL NOT NULL,
    "nationalId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "relationshipToHead" "RelationshipToHead" NOT NULL,
    "placeOfOrigin" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "workingAdress" TEXT NOT NULL,
    "residentStatus" "ResidenceStatus" NOT NULL DEFAULT 'NORMAL',
    "informationStatus" "InformationStatus" NOT NULL DEFAULT 'PENDING',
    "houseHoldId" INTEGER,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fee" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isMandatory" BOOLEAN DEFAULT true,
    "rate" DOUBLE PRECISION DEFAULT 0,
    "calculationBase" "FeeCalculationBase" NOT NULL DEFAULT 'PER_HOUSEHOLD',
    "anchorDay" INTEGER,
    "anchorMonth" INTEGER,
    "status" "FeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repeatfee" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isMandatory" BOOLEAN DEFAULT true,
    "frequency" "Frequency" NOT NULL,
    "rate" DOUBLE PRECISION DEFAULT 0,
    "calculationBase" "FeeCalculationBase" NOT NULL DEFAULT 'PER_HOUSEHOLD',
    "anchorDay" INTEGER,
    "anchorMonth" INTEGER,
    "status" "FeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repeatfee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeAssignment" (
    "id" SERIAL NOT NULL,
    "feeId" INTEGER NOT NULL,
    "householdId" INTEGER NOT NULL,
    "amountDue" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FeeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "feeAssignmentId" INTEGER NOT NULL,
    "amountPaid" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "imagePath" TEXT,
    "status" "InformationStatus" NOT NULL DEFAULT 'PENDING',
    "paidDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemporaryResident" (
    "id" SERIAL NOT NULL,
    "residentId" INTEGER NOT NULL,
    "householdId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "informationStatus" "InformationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedUserId" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAdminId" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,

    CONSTRAINT "TemporaryResident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemporaryAbsence" (
    "id" SERIAL NOT NULL,
    "residentId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "informationStatus" "InformationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedUserId" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAdminId" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,

    CONSTRAINT "TemporaryAbsence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentChanges" (
    "id" SERIAL NOT NULL,
    "residentId" INTEGER NOT NULL,
    "action" "Actions" NOT NULL,
    "submitUserId" INTEGER NOT NULL,
    "submitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateReason" TEXT,
    "reviewAdminId" INTEGER,
    "reviewAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "informationStatus" "InformationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ResidentChanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdChanges" (
    "id" SERIAL NOT NULL,
    "householdId" INTEGER NOT NULL,
    "action" "Actions" NOT NULL,
    "submitUserId" INTEGER NOT NULL,
    "submitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateReason" TEXT,
    "reviewAdminId" INTEGER,
    "reviewAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "informationStatus" "InformationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "HouseholdChanges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_householdId_key" ON "Users"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "HouseHolds_houseHoldCode_key" ON "HouseHolds"("houseHoldCode");

-- CreateIndex
CREATE UNIQUE INDEX "HouseHolds_apartmentNumber_key" ON "HouseHolds"("apartmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HouseHolds_headID_key" ON "HouseHolds"("headID");

-- CreateIndex
CREATE UNIQUE INDEX "HouseHolds_userID_key" ON "HouseHolds"("userID");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_nationalId_key" ON "Resident"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_phoneNumber_key" ON "Resident"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_email_key" ON "Resident"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_feeAssignmentId_key" ON "Payment"("feeAssignmentId");

-- AddForeignKey
ALTER TABLE "HouseHolds" ADD CONSTRAINT "HouseHolds_headID_fkey" FOREIGN KEY ("headID") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseHolds" ADD CONSTRAINT "HouseHolds_userID_fkey" FOREIGN KEY ("userID") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_houseHoldId_fkey" FOREIGN KEY ("houseHoldId") REFERENCES "HouseHolds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAssignment" ADD CONSTRAINT "FeeAssignment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "Fee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAssignment" ADD CONSTRAINT "FeeAssignment_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HouseHolds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_feeAssignmentId_fkey" FOREIGN KEY ("feeAssignmentId") REFERENCES "FeeAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryResident" ADD CONSTRAINT "TemporaryResident_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HouseHolds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryResident" ADD CONSTRAINT "TemporaryResident_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryResident" ADD CONSTRAINT "TemporaryResident_submittedUserId_fkey" FOREIGN KEY ("submittedUserId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryResident" ADD CONSTRAINT "TemporaryResident_reviewedAdminId_fkey" FOREIGN KEY ("reviewedAdminId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryAbsence" ADD CONSTRAINT "TemporaryAbsence_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryAbsence" ADD CONSTRAINT "TemporaryAbsence_submittedUserId_fkey" FOREIGN KEY ("submittedUserId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryAbsence" ADD CONSTRAINT "TemporaryAbsence_reviewedAdminId_fkey" FOREIGN KEY ("reviewedAdminId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentChanges" ADD CONSTRAINT "ResidentChanges_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentChanges" ADD CONSTRAINT "ResidentChanges_submitUserId_fkey" FOREIGN KEY ("submitUserId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentChanges" ADD CONSTRAINT "ResidentChanges_reviewAdminId_fkey" FOREIGN KEY ("reviewAdminId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdChanges" ADD CONSTRAINT "HouseholdChanges_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HouseHolds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdChanges" ADD CONSTRAINT "HouseholdChanges_submitUserId_fkey" FOREIGN KEY ("submitUserId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdChanges" ADD CONSTRAINT "HouseholdChanges_reviewAdminId_fkey" FOREIGN KEY ("reviewAdminId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
