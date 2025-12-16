/**
 * Simple Mock API Server for E2E Tests
 * 
 * Provides minimal API endpoints to support E2E tests without requiring
 * the full Python backend (pywrangler).
 * 
 * Uses Node's built-in http module (no dependencies needed).
 */

import http from 'http';

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
  id: `user-${Date.now()}`,
  email,
  name: email.split('@')[0],
  avatar: null,
});

const createMockTeam = (name, ownerId) => ({
  id: `team-${Date.now()}`,
  name,
  emoji: '🍕',
  color: '#3b82f6',
  ownerId,
  inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
  isHolidayMode: false,
  createdAt: Date.now(),
});

const createMockMember = (teamId, userId, name) => ({
  id: `member-${Date.now()}`,
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
          return sendJSON(res, { error: 'Team not found' }, 404);
        }
        const members = Object.values(mockMembers).filter((m) => m.teamId === teamId);
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

