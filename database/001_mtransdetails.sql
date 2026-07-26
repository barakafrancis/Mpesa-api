IF OBJECT_ID('dbo.mtransdetails', 'U') IS NULL
BEGIN
CREATE TABLE dbo.mtransdetails(
 [TransactionType] nvarchar(100) NULL,
 [TransID] nvarchar(100) NULL,
 [TransTime] nvarchar(50) NULL,
 [TransAmount] nvarchar(50) NULL,
 [BusinessShortCode] nvarchar(100) NULL,
 [BillRefNumber] nvarchar(50) NULL,
 [OrgAccountBalance] nvarchar(100) NULL,
 [MSISDN] nvarchar(100) NULL,
 [FirstName] nvarchar(100) NULL,
 [MiddleName] nvarchar(100) NULL,
 [LastName] nvarchar(100) NULL,
 [id] int IDENTITY(1,1) NOT NULL,
 [posted] bit NULL DEFAULT 0,
 [tranpushed] bit NULL DEFAULT 0,
 [paidtoaccount] nvarchar(100) NULL,
 [syncid] nvarchar(250) NULL,
 [voided] bit NULL DEFAULT 0,
 [voidedby] nvarchar(100) NULL,
 [voideddate] datetime NULL,
 [voidednote] nvarchar(250) NULL,
 CONSTRAINT PK_mtransdetails PRIMARY KEY CLUSTERED (id)
);
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_mtransdetails_TransID' AND object_id = OBJECT_ID('dbo.mtransdetails'))
CREATE UNIQUE INDEX UX_mtransdetails_TransID ON dbo.mtransdetails(TransID) WHERE TransID IS NOT NULL;
GO
CREATE INDEX IX_mtransdetails_Posted ON dbo.mtransdetails(posted);
GO
CREATE INDEX IX_mtransdetails_TransTime ON dbo.mtransdetails(TransTime);
GO
CREATE INDEX IX_mtransdetails_MSISDN ON dbo.mtransdetails(MSISDN);
GO
