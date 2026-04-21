-- CreateTable
CREATE TABLE "general_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pbsName" TEXT NOT NULL DEFAULT 'Gazipur Palli Bidyut Samity-2',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ledger_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mapping" TEXT NOT NULL DEFAULT '{}',
    "debitAccounts" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "interest_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tiers" TEXT NOT NULL DEFAULT '[]',
    "tdsRate" REAL NOT NULL DEFAULT 0.2,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberIdNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "dateJoined" DATETIME,
    "zonalOffice" TEXT,
    "permanentAddress" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "fund_summaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "summaryDate" DATETIME NOT NULL,
    "employeeContribution" REAL NOT NULL DEFAULT 0,
    "loanWithdrawal" REAL NOT NULL DEFAULT 0,
    "loanRepayment" REAL NOT NULL DEFAULT 0,
    "profitEmployee" REAL NOT NULL DEFAULT 0,
    "profitLoan" REAL NOT NULL DEFAULT 0,
    "pbsContribution" REAL NOT NULL DEFAULT 0,
    "profitPbs" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fund_summaries_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryDate" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "journalEntryId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "debit" REAL NOT NULL DEFAULT 0,
    "credit" REAL NOT NULL DEFAULT 0,
    "memo" TEXT,
    "memberId" TEXT,
    CONSTRAINT "journal_entry_lines_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "isHeader" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "investment_instruments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentType" TEXT NOT NULL,
    "bankName" TEXT,
    "principalAmount" REAL NOT NULL,
    "initialPrincipalAmount" REAL,
    "issueDate" DATETIME,
    "firstOpeningDate" DATETIME,
    "maturityDate" DATETIME,
    "interestRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "investment_audit_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investmentInstrumentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "investment_audit_history_investmentInstrumentId_fkey" FOREIGN KEY ("investmentInstrumentId") REFERENCES "investment_instruments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "members_memberIdNumber_key" ON "members"("memberIdNumber");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_code_key" ON "chart_of_accounts"("code");
