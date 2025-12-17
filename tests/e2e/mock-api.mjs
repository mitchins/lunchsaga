/**
 * Simple Mock API Server for E2E Tests
 * 
 * Provides minimal API endpoints to support E2E tests without requiring
 * the full Python backend (pywrangler).
 * 
 * Uses Node's built-in http module (no dependencies needed).
 */

import http from 'http';
import { randomUUID } from 'crypto';

// In-memory storage
const mockUsers = {};
const mockTeams = {};
const mockMembers = {};
const magicCodes = {}; // email -> code

// Helper to parse JSON body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON response
function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// Mock data creators
const createMockUser = (email) => ({
  id: `user-${randomUUID()}`,
  email,
  name: email.split('@')[0],
  avatar: null,
});

const createMockTeam = (name, ownerId) => ({
  id: `team-${randomUUID()}`,
  name,
  emoji: '🍕',
  color: '#3b82f6',
  ownerId,
  inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
  isHolidayMode: false,
  createdAt: Date.now(),
});

let memberCounter = 0;
const createMockMember = (teamId, userId, name) => ({
  id: `member-${randomUUID()}`,
  teamId,
  userId,
  name,
  points: 100,
  reputationScore: 50,
  totalVenuesProposed: 5,
  totalWins: 2,
  isAway: false,
  joinedAt: Date.now(),
});

// Get user from token
function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Auto-create user if token is valid but user doesn't exist (for pre-minted tokens)
    if (!mockUsers[decoded.email] && decoded.email && decoded.userId) {
      const user = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.email.split('@')[0],
        avatar: null,
      };
      mockUsers[decoded.email] = user;
      
      // Auto-create a default team with mock members for E2E tests
      // Use a predictable team ID so tests can navigate directly with teamId in URL
      const team = {
        id: 'test-team-001',
        name: 'Test Team',
        emoji: '🍕',
        color: '#3b82f6',
        ownerId: user.id,
        inviteCode: 'TEST001',
        isHolidayMode: false,
        createdAt: Date.now(),
      };
      mockTeams[team.id] = team;
      
      // Create current user as team member
      const currentMember = createMockMember(team.id, user.id, user.name);
      mockMembers[currentMember.id] = currentMember;
      
      // Create additional mock members for testing
      for (let i = 1; i <= 4; i++) {
        const mockUser = {
          id: `mock-user-${i}`,
          email: `member${i}@test.com`,
          name: `Team Member ${i}`,
          avatar: null,
        };
        const member = createMockMember(team.id, mockUser.id, mockUser.name);
        member.points = 100 + (i * 50);
        member.reputationScore = 50 + (i * 10);
        mockMembers[member.id] = member;
      }
      
      console.log(`[MOCK-API] Created team test-team-001 with ${Object.values(mockMembers).filter(m => m.teamId === 'test-team-001').length} members`);
    }
    
    return mockUsers[decoded.email];
  } catch {
    return null;
  }
}

// Request handler
async function handleRequest(req, res) {
  const url = req.url || '';
  const method = req.method || 'GET';

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    sendJSON(res, {}, 200);
    return;
  }

  try {
    // Auth endpoints
    if (method === 'POST' && url === '/api/auth/magic-link') {
      const body = await parseBody(req);
      const { email } = body;

      if (!email) {
        return sendJSON(res, { error: 'Email required' }, 400);
      }

      const code = '000000'; // Fixed code for E2E tests
      magicCodes[email] = code;

      // Log to console so Playwright can capture it
      console.log(`Magic link code for ${email}: ${code}`);

      return sendJSON(res, { sent: true, email });
    }

    if (method === 'POST' && url === '/api/auth/verify') {
      const body = await parseBody(req);
      const { email, code } = body;

      if (!email || !code) {
        return sendJSON(res, { error: 'Email and code required' }, 400);
      }

      if (magicCodes[email] !== code) {
        return sendJSON(res, { error: 'Invalid code' }, 401);
      }

      let user = mockUsers[email];
      if (!user) {
        user = createMockUser(email);
        mockUsers[email] = user;
      }

      const token = Buffer.from(JSON.stringify({ userId: user.id, email })).toString('base64');

      return sendJSON(res, { token, user });
    }

    if (method === 'GET' && url === '/api/auth/me') {
      const user = getUserFromToken(req.headers.authorization);
      if (!user) {
        return sendJSON(res, { error: 'Unauthorized' }, 401);
      }
      return sendJSON(res, { user });
    }

    if (method === 'PUT' && url === '/api/auth/me') {
      const user = getUserFromToken(req.headers.authorization);
      if (!user) {
        return sendJSON(res, { error: 'Unauthorized' }, 401);
      }

      const body = await parseBody(req);
      const { name, avatar } = body;
      if (name) user.name = name;
      if (avatar !== undefined) user.avatar = avatar;

      return sendJSON(res, { user });
    }

    if (method === 'POST' && url === '/api/auth/logout') {
      return sendJSON(res, { success: true });
    }

    // Teams endpoints
    if (method === 'GET' && url === '/api/teams') {
      const user = getUserFromToken(req.headers.authorization);
      if (!user) {
        return sendJSON(res, { error: 'Unauthorized' }, 401);
      }

      const teams = Object.values(mockTeams);
      return sendJSON(res, { teams });
    }

    if (method === 'POST' && url === '/api/teams') {
      const user = getUserFromToken(req.headers.authorization);
      if (!user) {
        return sendJSON(res, { error: 'Unauthorized' }, 401);
      }

      const body = await parseBody(req);
      const { name, emoji, color } = body;
      const team = createMockTeam(name, user.id);

      if (emoji) team.emoji = emoji;
      if (color) team.color = color;

      mockTeams[team.id] = team;

      const member = createMockMember(team.id, user.id, user.name);
      mockMembers[member.id] = member;

      return sendJSON(res, { team });
    }

    if (method === 'GET' && url.startsWith('/api/teams/')) {
      const parts = url.split('/');
      const teamId = parts[3];

      if (parts.length === 4) {
        // GET /api/teams/:teamId
        const team = mockTeams[teamId];
        if (!team) {
          return sendJSON(res, { error: 'Team not found' }, 404);
        }
        return sendJSON(res, { team });
      }

      if (parts.length === 5 && parts[4] === 'members') {
        // GET /api/teams/:teamId/members
        const team = mockTeams[teamId];
        if (!team) {
          console.log(`[MOCK-API] Team ${teamId} not found. Available teams:`, Object.keys(mockTeams));
          return sendJSON(res, { error: 'Team not found' }, 404);
        }
        const members = Object.values(mockMembers).filter((m) => m.teamId === teamId);
        console.log(`[MOCK-API] GET /api/teams/${teamId}/members returned ${members.length} members`);
        return sendJSON(res, { members });
      }
    }

    // Catch-all for unimplemented endpoints
    console.log(`Unimplemented endpoint: ${method} ${url}`);
    return sendJSON(res, { error: 'Endpoint not implemented in mock API' }, 501);

  } catch (error) {
    console.error('Error handling request:', error);
    return sendJSON(res, { error: 'Internal server error' }, 500);
  }
}

const PORT = 3757; // Same port as real API

export function startMockAPI() {
  return new Promise((resolve) => {
    const server = http.createServer(handleRequest);
    server.listen(PORT, () => {
      console.log(`Mock API server listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startMockAPI();
}

