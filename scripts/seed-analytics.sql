-- Seed Analytics Data SQL Script
-- This script populates the database with test data for analytics testing

-- First, let's check if we have any existing test data and create GUIDs
DECLARE @clinicianUserId UNIQUEIDENTIFIER = NEWID();
DECLARE @clinicianId UNIQUEIDENTIFIER = NEWID();
DECLARE @service1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @service2Id UNIQUEIDENTIFIER = NEWID();
DECLARE @service3Id UNIQUEIDENTIFIER = NEWID();

-- Client IDs
DECLARE @client1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @client2Id UNIQUEIDENTIFIER = NEWID();
DECLARE @client3Id UNIQUEIDENTIFIER = NEWID();
DECLARE @client4Id UNIQUEIDENTIFIER = NEWID();
DECLARE @client5Id UNIQUEIDENTIFIER = NEWID();

-- Client Group IDs
DECLARE @group1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @group2Id UNIQUEIDENTIFIER = NEWID();
DECLARE @group3Id UNIQUEIDENTIFIER = NEWID();
DECLARE @group4Id UNIQUEIDENTIFIER = NEWID();

-- Create a test clinician if none exists
IF NOT EXISTS (SELECT 1 FROM Clinician WHERE speciality = 'LMFT')
BEGIN
    -- Create user for clinician
    INSERT INTO [User] (id, email, password_hash)
    VALUES (@clinicianUserId, 'test.clinician@mcw.com', 'hashed_password');

    -- Create clinician
    INSERT INTO Clinician (id, user_id, first_name, last_name, speciality, percentage_split, address)
    VALUES (@clinicianId, @clinicianUserId, 'Test', 'Clinician', 'LMFT', 70.0, '123 Main St');
END
ELSE
BEGIN
    -- Get existing clinician
    SELECT TOP 1 @clinicianId = id, @clinicianUserId = user_id 
    FROM Clinician 
    WHERE speciality = 'LMFT';
END

-- Create practice services if they don't exist
IF NOT EXISTS (SELECT 1 FROM PracticeService WHERE type = 'Individual Therapy')
BEGIN
    INSERT INTO PracticeService (id, type, code, rate, duration)
    VALUES 
        (@service1Id, 'Individual Therapy', '90834', 150.00, 45),
        (@service2Id, 'Family Therapy', '90847', 200.00, 50),
        (@service3Id, 'Couples Therapy', '90847', 180.00, 50);
END
ELSE
BEGIN
    -- Get existing service IDs
    SELECT TOP 1 @service1Id = id FROM PracticeService WHERE type = 'Individual Therapy';
    SELECT TOP 1 @service2Id = id FROM PracticeService WHERE type = 'Family Therapy';
    SELECT TOP 1 @service3Id = id FROM PracticeService WHERE type = 'Couples Therapy';
END

-- Create test clients
INSERT INTO Client (id, legal_first_name, legal_last_name, preferred_name, date_of_birth, is_active, created_at)
VALUES 
    (@client1Id, 'John', 'Regular', 'John', '1985-05-15', 1, GETDATE()),
    (@client2Id, 'Sarah', 'Outstanding', 'Sarah', '1990-08-22', 1, GETDATE()),
    (@client3Id, 'Michael', 'Family', 'Mike', '1980-03-10', 1, GETDATE()),
    (@client4Id, 'Jennifer', 'Family', 'Jen', '1982-07-18', 1, GETDATE()),
    (@client5Id, 'David', 'Irregular', 'Dave', '1995-11-30', 1, GETDATE());

-- Create client groups
INSERT INTO ClientGroup (id, name, type, available_credit)
VALUES 
    (@group1Id, 'John Regular', 'individual', 0.00),
    (@group2Id, 'Sarah Outstanding', 'individual', 0.00),
    (@group3Id, 'Family Group', 'family', 50.00),
    (@group4Id, 'David Irregular', 'individual', 0.00);

-- Create client group memberships
INSERT INTO ClientGroupMembership (client_id, client_group_id, role, is_responsible_for_billing, is_contact_only)
VALUES 
    (@client1Id, @group1Id, 'Primary Patient', 1, 0),
    (@client2Id, @group2Id, 'Primary Patient', 1, 0),
    (@client3Id, @group3Id, 'Primary Patient', 1, 0),
    (@client4Id, @group3Id, 'Spouse/Partner', 0, 0),
    (@client5Id, @group4Id, 'Primary Patient', 1, 0);

-- Create default tags if they don't exist
IF NOT EXISTS (SELECT 1 FROM Tag WHERE name = 'Appointment Paid')
BEGIN
    INSERT INTO Tag (id, name, color)
    VALUES 
        ('11111111-1111-1111-1111-111111111111', 'Appointment Paid', '#10b981'),
        ('22222222-2222-2222-2222-222222222222', 'Appointment Unpaid', '#ef4444'),
        ('33333333-3333-3333-3333-333333333333', 'New Client', '#3b82f6'),
        ('44444444-4444-4444-4444-444444444444', 'No Note', '#f59e0b'),
        ('55555555-5555-5555-5555-555555555555', 'Note Added', '#22c55e');
END

-- Create appointments with various statuses for the last 90 days
DECLARE @currentDate DATETIME = GETDATE();
DECLARE @appointmentId UNIQUEIDENTIFIER;
DECLARE @invoiceId UNIQUEIDENTIFIER;
DECLARE @counter INT = 1;
DECLARE @dayOffset INT;
DECLARE @status NVARCHAR(50);
DECLARE @serviceId UNIQUEIDENTIFIER;
DECLARE @groupId UNIQUEIDENTIFIER;
DECLARE @appointmentFee DECIMAL(10,2);

-- Create appointments for each client group
WHILE @counter <= 40 -- Create 40 appointments total
BEGIN
    SET @appointmentId = NEWID();
    SET @dayOffset = -FLOOR(RAND() * 90); -- Random date within last 90 days
    
    -- Determine status (70% SHOW, 10% NO_SHOW, 10% CANCELLED, 5% LATE_CANCELLED, 5% CLINICIAN_CANCELLED)
    DECLARE @statusRand FLOAT = RAND();
    SET @status = CASE 
        WHEN @statusRand < 0.70 THEN 'SHOW'
        WHEN @statusRand < 0.80 THEN 'NO_SHOW'
        WHEN @statusRand < 0.90 THEN 'CANCELLED'
        WHEN @statusRand < 0.95 THEN 'LATE_CANCELLED'
        ELSE 'CLINICIAN_CANCELLED'
    END;
    
    -- Select random service
    DECLARE @serviceRand FLOAT = RAND();
    SET @serviceId = CASE 
        WHEN @serviceRand < 0.33 THEN @service1Id
        WHEN @serviceRand < 0.66 THEN @service2Id
        ELSE @service3Id
    END;
    
    -- Select client group (distribute appointments)
    DECLARE @groupRand FLOAT = RAND();
    SET @groupId = CASE 
        WHEN @groupRand < 0.30 THEN @group1Id -- John Regular (30%)
        WHEN @groupRand < 0.50 THEN @group2Id -- Sarah Outstanding (20%)
        WHEN @groupRand < 0.75 THEN @group3Id -- Family Group (25%)
        ELSE @group4Id -- David Irregular (25%)
    END;
    
    -- Get appointment fee based on service
    SELECT @appointmentFee = rate FROM PracticeService WHERE id = @serviceId;
    
    -- Insert appointment
    INSERT INTO Appointment (
        id, client_group_id, clinician_id, service_id, status, type, 
        start_date, end_date, appointment_fee, adjustable_amount, write_off,
        created_by, created_at
    )
    VALUES (
        @appointmentId, 
        @groupId, 
        @clinicianId, 
        @serviceId, 
        @status, 
        'APPOINTMENT',
        DATEADD(DAY, @dayOffset, @currentDate),
        DATEADD(HOUR, 1, DATEADD(DAY, @dayOffset, @currentDate)),
        @appointmentFee,
        CASE WHEN @status = 'SHOW' THEN ROUND((RAND() * 40 - 20), 2) ELSE 0 END, -- Random adjustment -20 to +20
        CASE WHEN @status = 'NO_SHOW' THEN ROUND((RAND() * 50), 2) ELSE 0 END, -- Random write-off 0 to 50
        @clinicianUserId, -- created_by requires a user ID
        GETDATE()
    );
    
    -- Create appointment notes for completed appointments (90% chance)
    IF @status = 'SHOW' AND RAND() > 0.1
    BEGIN
        DECLARE @noteId UNIQUEIDENTIFIER = NEWID();
        DECLARE @surveyId UNIQUEIDENTIFIER = NEWID();
        DECLARE @noteStatusRand FLOAT = RAND();
        DECLARE @isSigned BIT = CASE WHEN @noteStatusRand > 0.5 THEN 1 ELSE 0 END;
        
        -- Create survey answer if note is from survey (50% chance)
        IF RAND() > 0.5
        BEGIN
            INSERT INTO SurveyAnswers (
                id, client_id, template_id, assigned_at, status
            )
            VALUES (
                @surveyId,
                CASE 
                    WHEN @groupId = @group1Id THEN @client1Id
                    WHEN @groupId = @group2Id THEN @client2Id
                    WHEN @groupId = @group3Id THEN @client3Id
                    ELSE @client5Id
                END,
                '00000000-0000-0000-0000-000000000001', -- Placeholder template
                GETDATE(),
                CASE WHEN @isSigned = 1 THEN 'COMPLETED' ELSE 'IN_PROGRESS' END
            );
        END
        ELSE
        BEGIN
            SET @surveyId = '00000000-0000-0000-0000-000000000000';
        END
        
        -- Insert appointment note
        INSERT INTO AppointmentNotes (
            id, appointment_id, type, is_signed, survey_answer_id
        )
        VALUES (
            @noteId,
            @appointmentId,
            'PROGRESS_NOTE',
            @isSigned,
            @surveyId
        );
        
        -- Add appointment tag based on note status
        INSERT INTO AppointmentTag (id, appointment_id, tag_id)
        VALUES (
            NEWID(),
            @appointmentId,
            '55555555-5555-5555-5555-555555555555' -- Note Added tag
        );
    END
    ELSE IF @status = 'SHOW'
    BEGIN
        -- Add "No Note" tag
        INSERT INTO AppointmentTag (id, appointment_id, tag_id)
        VALUES (
            NEWID(),
            @appointmentId,
            '44444444-4444-4444-4444-444444444444' -- No Note tag
        );
    END
    
    -- Create invoices for non-cancelled appointments
    IF @status IN ('SHOW', 'NO_SHOW')
    BEGIN
        SET @invoiceId = NEWID();
        DECLARE @invoiceAmount DECIMAL(10,2);
        DECLARE @adjustableAmount DECIMAL(10,2);
        DECLARE @writeOff DECIMAL(10,2);
        
        -- Get adjustment amounts
        SELECT 
            @adjustableAmount = ISNULL(adjustable_amount, 0),
            @writeOff = ISNULL(write_off, 0)
        FROM Appointment WHERE id = @appointmentId;
        
        SET @invoiceAmount = @appointmentFee + @adjustableAmount - @writeOff;
        
        -- Determine invoice status based on client
        DECLARE @invoiceStatus NVARCHAR(50);
        SET @invoiceStatus = CASE 
            WHEN @groupId = @group1Id AND RAND() > 0.2 THEN 'PAID' -- John Regular - 80% paid
            WHEN @groupId = @group2Id AND RAND() > 0.8 THEN 'PAID' -- Sarah Outstanding - 20% paid
            WHEN @groupId = @group3Id AND RAND() > 0.5 THEN 'PAID' -- Family Group - 50% paid
            WHEN @groupId = @group4Id AND RAND() > 0.6 THEN 'PAID' -- David Irregular - 40% paid
            ELSE 'SENT'
        END;
        
        -- Insert invoice
        INSERT INTO Invoice (
            id, invoice_number, client_group_id, appointment_id, 
            issued_date, due_date, amount, status, type
        )
        VALUES (
            @invoiceId,
            CONCAT('INV-', YEAR(@currentDate), '-', @counter, '-', FLOOR(RAND() * 1000)),
            @groupId,
            @appointmentId,
            DATEADD(DAY, @dayOffset + 1, @currentDate), -- Issue day after appointment
            DATEADD(DAY, @dayOffset + 30, @currentDate), -- Due in 30 days
            @invoiceAmount,
            @invoiceStatus,
            'INVOICE'
        );
        
        -- Add appointment payment status tag
        INSERT INTO AppointmentTag (id, appointment_id, tag_id)
        VALUES (
            NEWID(),
            @appointmentId,
            CASE 
                WHEN @invoiceStatus = 'PAID' THEN '11111111-1111-1111-1111-111111111111' -- Paid tag
                ELSE '22222222-2222-2222-2222-222222222222' -- Unpaid tag
            END
        );
        
        -- Create payment for paid invoices
        IF @invoiceStatus = 'PAID'
        BEGIN
            DECLARE @paymentDate DATETIME = DATEADD(DAY, @dayOffset + FLOOR(RAND() * 20 + 2), @currentDate);
            DECLARE @creditApplied DECIMAL(10,2) = 0;
            
            -- Apply credit for family group sometimes
            IF @groupId = @group3Id AND RAND() > 0.7
            BEGIN
                SET @creditApplied = ROUND(@invoiceAmount * 0.2, 2);
                IF @creditApplied > 50 SET @creditApplied = 50; -- Max available credit
            END
            
            INSERT INTO Payment (
                id, invoice_id, amount, payment_date,
                status, credit_applied, transaction_id
            )
            VALUES (
                NEWID(),
                @invoiceId,
                @invoiceAmount - @creditApplied,
                @paymentDate,
                'COMPLETED',
                @creditApplied,
                CONCAT('TXN-', YEAR(@currentDate), '-', @counter, '-', FLOOR(RAND() * 10000))
            );
            
            -- Update group credit if used
            IF @creditApplied > 0
            BEGIN
                UPDATE ClientGroup 
                SET available_credit = available_credit - @creditApplied
                WHERE id = @group3Id;
            END
        END
    END
    
    SET @counter = @counter + 1;
END

-- Create some recurring events
INSERT INTO Appointment (
    id, clinician_id, status, type, title, 
    start_date, end_date, is_recurring, recurring_rule,
    created_by, created_at
)
VALUES 
    (NEWID(), @clinicianId, 'SHOW', 'EVENT', 'Staff Meeting',
     DATEADD(DAY, -7, @currentDate), DATEADD(HOUR, 1, DATEADD(DAY, -7, @currentDate)),
     1, 'FREQ=WEEKLY;BYDAY=MO', @clinicianUserId, GETDATE()),
    (NEWID(), @clinicianId, 'SHOW', 'EVENT', 'Supervision',
     DATEADD(DAY, -14, @currentDate), DATEADD(HOUR, 2, DATEADD(DAY, -14, @currentDate)),
     1, 'FREQ=WEEKLY;BYDAY=WE', @clinicianUserId, GETDATE());

-- Add "New Client" tags to first appointments for each client
DECLARE @firstAppointmentId UNIQUEIDENTIFIER;

-- For each client group, find first appointment and add "New Client" tag
SELECT TOP 1 @firstAppointmentId = id 
FROM Appointment 
WHERE client_group_id = @group1Id 
ORDER BY start_date;

IF @firstAppointmentId IS NOT NULL
BEGIN
    INSERT INTO AppointmentTag (id, appointment_id, tag_id)
    VALUES (NEWID(), @firstAppointmentId, '33333333-3333-3333-3333-333333333333');
END

SELECT TOP 1 @firstAppointmentId = id 
FROM Appointment 
WHERE client_group_id = @group2Id 
ORDER BY start_date;

IF @firstAppointmentId IS NOT NULL
BEGIN
    INSERT INTO AppointmentTag (id, appointment_id, tag_id)
    VALUES (NEWID(), @firstAppointmentId, '33333333-3333-3333-3333-333333333333');
END

-- Print summary
DECLARE @appointmentCount INT;
DECLARE @invoiceCount INT;
DECLARE @paymentCount INT;
DECLARE @noteCount INT;

SELECT @appointmentCount = COUNT(*) FROM Appointment;
SELECT @invoiceCount = COUNT(*) FROM Invoice;
SELECT @paymentCount = COUNT(*) FROM Payment;
SELECT @noteCount = COUNT(*) FROM AppointmentNotes;

PRINT 'Analytics data seeding completed!';
PRINT '';
PRINT 'Summary:';
PRINT '- Clients created: 5';
PRINT '- Client groups created: 4';
PRINT '- Total appointments in database: ' + CAST(@appointmentCount AS VARCHAR);
PRINT '- Total invoices in database: ' + CAST(@invoiceCount AS VARCHAR);
PRINT '- Total payments in database: ' + CAST(@paymentCount AS VARCHAR);
PRINT '- Total notes in database: ' + CAST(@noteCount AS VARCHAR);