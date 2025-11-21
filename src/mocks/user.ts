import { User } from '@/lib/types'

export const mockUser: User = {
  id: 'user-1',
  email: 'alice@example.com',
  name: 'Alice Johnson',
  avatar: undefined,
  createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
}

export const mockUsers: User[] = [
  mockUser,
  {
    id: 'user-2',
    email: 'bob@example.com',
    name: 'Bob Smith',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'user-3',
    email: 'charlie@example.com',
    name: 'Charlie Brown',
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'user-4',
    email: 'diana@example.com',
    name: 'Diana Prince',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'user-5',
    email: 'ethan@example.com',
    name: 'Ethan Hunt',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
  },
]
