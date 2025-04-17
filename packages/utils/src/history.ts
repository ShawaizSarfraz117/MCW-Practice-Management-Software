import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateHistoryParams {
  description: string;
  userId?: string;
  clientId?: string;
  isHipaa?: boolean;
}

/**
 * Creates a history log entry to track activities
 * @param params Parameters for creating a history entry
 * @returns The created history entry
 */
export async function createHistory({
  description,
  userId,
  clientId,
  isHipaa = false,
}: CreateHistoryParams) {
  try {
    const history = await prisma.audit.create({
      data: {
        event_type: 'History events',
        event_text: description,
        user_id: userId,
        client_id: clientId,
        is_hipaa: isHipaa,
      },
    });

    return history;
  } catch (error) {
    console.error('Error creating history entry:', error);
    throw new Error('Failed to create history entry');
  }
} 

// USAGE

// import { createHistory } from '@mcw/utils';

// await createHistory({
//   description: "Updated client contact information",
//   userId: currentUserId,
//   clientId,
//   isHipaa: true
// });