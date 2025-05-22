BEGIN TRY

BEGIN TRAN;

-- AlterTable
EXEC SP_RENAME N'dbo.PK_License', N'License_pkey';
ALTER TABLE [dbo].[License] ADD CONSTRAINT [License_id_df] DEFAULT newid() FOR [id];

-- CreateTable
CREATE TABLE [dbo].[vw_billing_documents] (
    [document_id] NVARCHAR(1000) NOT NULL,
    [document_type] NVARCHAR(1000) NOT NULL,
    [document_number] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [deliver_method] NVARCHAR(1000) NOT NULL CONSTRAINT [vw_billing_documents_deliver_method_df] DEFAULT 'Manual',
    [view_all] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [client_group_id] NVARCHAR(1000) NOT NULL,
    [issued_date] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL,
    CONSTRAINT [vw_billing_documents_pkey] PRIMARY KEY CLUSTERED ([document_id])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
