BEGIN TRY

BEGIN TRAN;

-- DropIndex
ALTER TABLE [dbo].[PracticeService] DROP CONSTRAINT [PracticeService_code_key];

-- AlterTable
ALTER TABLE [dbo].[PracticeService] ADD [allow_new_clients] BIT NOT NULL CONSTRAINT [PracticeService_allow_new_clients_df] DEFAULT 0,
[available_online] BIT NOT NULL CONSTRAINT [PracticeService_available_online_df] DEFAULT 0,
[bill_in_units] BIT NOT NULL CONSTRAINT [PracticeService_bill_in_units_df] DEFAULT 0,
[block_after] INT NOT NULL CONSTRAINT [PracticeService_block_after_df] DEFAULT 0,
[block_before] INT NOT NULL CONSTRAINT [PracticeService_block_before_df] DEFAULT 0,
[is_default] BIT NOT NULL CONSTRAINT [PracticeService_is_default_df] DEFAULT 0,
[require_call] BIT NOT NULL CONSTRAINT [PracticeService_require_call_df] DEFAULT 0;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
