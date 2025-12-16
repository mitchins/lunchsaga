# Kinglet D1 Mock Library Uplift Requirements

## Executive Summary

The current `FaithfulMockD1Database` implementation in Kinglet 1.8.1 provides basic SQL parsing for unit testing but has significant limitations that prevent full test coverage of the LunchSaga application's auth and business logic services. This document outlines the requirements needed to make the D1 mock production-ready for comprehensive unit testing.

## Current State

### What Works ✅
- Basic INSERT statements with explicit column lists
- Simple SELECT with single WHERE conditions (column = ?)
- UPDATE statements with basic SET clauses
- DELETE statements with WHERE conditions
- Auto-increment primary key handling
- D1-compatible result objects (MockResult, MockMeta, MockRow)
- CREATE TABLE statement parsing
- Batch statement execution

### What's Missing ❌
- Complex WHERE clauses with multiple AND/OR conditions
- JOIN operations (INNER, LEFT, RIGHT, FULL)
- Subqueries in WHERE and FROM clauses
- Aggregate functions (COUNT, SUM, AVG, MAX, MIN)
- GROUP BY and HAVING clauses
- Column aliases and table aliases
- DISTINCT keyword support
- OFFSET pagination
- IN, NOT IN operators
- LIKE, NOT LIKE pattern matching
- IS NULL, IS NOT NULL conditions
- BETWEEN operator
- CASE expressions
- Window functions
- Common Table Expressions (CTEs)
- Transactions with ROLLBACK/COMMIT
- Foreign key constraint validation
- Index simulation for performance testing
- Complex column name parsing (quoted identifiers, reserved words)

## Required Enhancements

### Priority 1: Critical for Basic ORM Support

#### 1.1 Enhanced WHERE Clause Parsing
**Current Limitation**: Only handles simple `column = ?` patterns and basic AND conditions.

**Required Features**:
```python
# Support multiple conditions with proper binding
WHERE email = ? AND used = ? AND expires_at > ?

# Support OR conditions
WHERE (email = ? AND code = ?) OR token = ?

# Support IN operator
WHERE id IN (?, ?, ?)

# Support NULL checks
WHERE deleted_at IS NULL

# Support comparison operators
WHERE created_at > ? AND created_at < ?

# Support LIKE pattern matching
WHERE name LIKE ?

# Support NOT conditions
WHERE NOT (status = ? OR archived = ?)
```

**Implementation Approach**:
- Build a proper SQL parser using a library like `sqlparse` or implement a recursive descent parser
- Create an AST (Abstract Syntax Tree) for WHERE conditions
- Evaluate conditions against row data with proper operator precedence
- Handle parameterized binding correctly for all operators

#### 1.2 Aggregate Functions and GROUP BY
**Current Limitation**: No support for aggregations.

**Required Features**:
```python
# Count records
SELECT COUNT(*) FROM users WHERE active = ?

# Group by with aggregates
SELECT team_id, COUNT(*) as member_count 
FROM team_members 
GROUP BY team_id

# Multiple aggregates
SELECT team_id, 
       COUNT(*) as total, 
       AVG(points) as avg_points,
       MAX(reputation_score) as top_score
FROM team_members
GROUP BY team_id
HAVING COUNT(*) > ?
```

**Implementation Approach**:
- Parse aggregate function calls and their arguments
- Implement grouping logic to partition rows
- Calculate aggregates per group
- Support HAVING clause filtering on aggregate results

#### 1.3 JOIN Operations
**Current Limitation**: No JOIN support.

**Required Features**:
```python
# INNER JOIN
SELECT u.email, tm.name, tm.points
FROM users u
INNER JOIN team_members tm ON u.id = tm.user_id
WHERE tm.team_id = ?

# LEFT JOIN
SELECT t.name, COUNT(tm.id) as member_count
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
GROUP BY t.id

# Multiple joins
SELECT p.id, p.status, v.name, v.vote_count, m.name as proposer
FROM lunch_periods p
INNER JOIN venue_options v ON p.id = v.period_id
INNER JOIN team_members m ON v.proposed_by = m.id
WHERE p.team_id = ?
```

**Implementation Approach**:
- Parse JOIN clauses (type, table, ON condition)
- Implement join algorithms (nested loop for simplicity)
- Handle column references with table prefixes
- Support table aliases

### Priority 2: Important for Comprehensive Testing

#### 2.1 Subqueries
**Required Features**:
```python
# Subquery in WHERE
SELECT * FROM users 
WHERE id IN (SELECT user_id FROM team_members WHERE team_id = ?)

# Subquery in FROM
SELECT team_stats.team_id, teams.name, team_stats.member_count
FROM (
    SELECT team_id, COUNT(*) as member_count 
    FROM team_members 
    GROUP BY team_id
) team_stats
INNER JOIN teams ON team_stats.team_id = teams.id
```

#### 2.2 Transaction Support
**Required Features**:
```python
# Begin transaction
await db.exec("BEGIN TRANSACTION")

# Perform operations
await User.objects.create(db, email=email, name=name)
await TeamMember.objects.create(db, team_id=team_id, user_id=user.id)

# Rollback on error
await db.exec("ROLLBACK")

# Commit on success
await db.exec("COMMIT")
```

**Implementation Approach**:
- Track transaction state
- Create snapshots of table data on BEGIN
- Restore snapshots on ROLLBACK
- Clear snapshots on COMMIT
- Implement isolation levels (at least READ COMMITTED)

#### 2.3 Advanced Operators
**Required Features**:
```python
# BETWEEN
WHERE created_at BETWEEN ? AND ?

# CASE expressions
SELECT id, 
       CASE 
           WHEN points > 100 THEN 'gold'
           WHEN points > 50 THEN 'silver'
           ELSE 'bronze'
       END as tier
FROM team_members

# COALESCE
SELECT COALESCE(avatar, 'default.png') as avatar_url
FROM users
```

### Priority 3: Nice to Have for Advanced Testing

#### 3.1 Common Table Expressions (CTEs)
```python
WITH active_members AS (
    SELECT * FROM team_members WHERE is_away = false
)
SELECT team_id, COUNT(*) as active_count
FROM active_members
GROUP BY team_id
```

#### 3.2 Window Functions
```python
SELECT name, points,
       ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY points DESC) as rank
FROM team_members
```

#### 3.3 Foreign Key Constraints
- Validate referential integrity on INSERT/UPDATE
- Cascade deletes when configured
- Prevent orphaned records

## Architecture Recommendations

### Option 1: SQL Parser Library (Recommended)
Use `sqlparse` library for parsing and build execution engine on top.

**Pros**:
- Robust SQL parsing
- Handles edge cases and SQL dialects
- Active maintenance

**Cons**:
- Additional dependency
- Need to build execution engine

**Example**:
```python
import sqlparse

def parse_query(sql):
    statements = sqlparse.parse(sql)
    stmt = statements[0]
    # Extract components and build execution plan
```

### Option 2: Full SQL Engine (Alternative)
Use a lightweight SQL engine like `sqlite3` in-memory mode.

**Pros**:
- Complete SQL support
- Well-tested
- Standard library (sqlite3)

**Cons**:
- Overhead of full database
- May not match D1 behavior exactly
- Harder to simulate D1-specific features

**Example**:
```python
import sqlite3

class D1MockWithSQLite:
    def __init__(self):
        self.conn = sqlite3.connect(':memory:')
        self.conn.row_factory = sqlite3.Row
```

### Option 3: Gradual Enhancement (Current Approach)
Continue building regex-based parser with incremental improvements.

**Pros**:
- No external dependencies
- Full control over behavior
- Can match D1 exactly

**Cons**:
- Time-consuming to implement all features
- Risk of bugs in complex parsing
- Maintenance burden

## Migration Path for LunchSaga

### Phase 1: Email Testing (Completed ✅)
- Email service fully tested with MockEmailSender
- 16 comprehensive tests passing
- No database dependencies

### Phase 2: Simple Service Logic
For services that don't require complex queries:
- Use integration tests with pywrangler
- Keep unit tests focused on business logic, not data layer

### Phase 3: Enhanced D1 Mock (Future)
When library is uplifted:
- Add comprehensive auth service tests
- Test all service layer business logic
- Achieve 80%+ coverage without pywrangler

## Immediate Workarounds

Until the D1 mock is enhanced, use these patterns:

### 1. Test Business Logic Separately
```python
# Don't test
async def test_verify_user_integration():
    result = await AuthService.verify(db, email, code, env)
    assert result is not None

# Instead, test logic components
def test_generate_jwt_token():
    token = AuthService._generate_jwt_token(user_data, secret)
    decoded = jwt.decode(token, secret)
    assert decoded['user_id'] == user_data['id']
```

### 2. Use Integration Tests for Data Layer
```python
# api/tests/test_api.py - with pywrangler
async def test_auth_flow_integration(client, reset_db):
    # Full end-to-end test with real database
    await client.post("/api/auth/magic-link", json={"email": email})
    result = await client.post("/api/auth/verify", json={"email": email, "code": code})
    assert result.status_code == 200
```

### 3. Mock at Service Boundary
```python
# Mock the database calls, test business logic
@pytest.fixture
def mock_db():
    db = Mock()
    db.prepare.return_value.bind.return_value.first.return_value = MockRow(user_data)
    return db

async def test_service_logic(mock_db):
    result = await AuthService.verify(mock_db, email, code, env)
    # Test logic without real SQL
```

## Estimated Effort

### Minimal Viable Enhancement (Priority 1 only)
- Enhanced WHERE clause parsing: 3-5 days
- Aggregate functions: 2-3 days
- Basic JOIN support: 3-4 days
- **Total**: ~2 weeks

### Comprehensive Enhancement (Priority 1 + 2)
- All Priority 1 features: 2 weeks
- Transaction support: 2-3 days
- Advanced operators: 3-4 days
- Subqueries: 4-5 days
- **Total**: ~3-4 weeks

### Production-Ready (All Priorities)
- All features: 4-6 weeks
- Testing and edge cases: 1-2 weeks
- Documentation: 1 week
- **Total**: ~2 months

## Recommendations

1. **Short Term**: Accept current limitations, use integration tests for complex scenarios
2. **Medium Term**: Implement Priority 1 features for basic ORM coverage
3. **Long Term**: Consider Option 2 (SQLite-based mock) for full SQL support
4. **Alternative**: Investigate other D1 mock libraries in the ecosystem

## Success Criteria

A fully uplifted D1 mock should enable:
- ✅ 100% of unit tests passing without pywrangler
- ✅ 80%+ code coverage for all service layer modules
- ✅ Test execution under 1 second for entire unit test suite
- ✅ Zero external service dependencies (no pywrangler, no miniflare)
- ✅ Full ORM query pattern support
- ✅ Accurate D1 behavior simulation

## Conclusion

The current Kinglet 1.8.1 D1 mock provides a foundation but requires significant enhancement to support comprehensive unit testing. The email functionality is production-ready and demonstrates the value of proper mocking. For full test coverage, either:

1. Invest in uplifting the D1 mock (recommended for long-term value)
2. Continue using integration tests for database-dependent code
3. Adopt SQLite-based mocking for immediate full SQL support

The choice depends on project priorities, timeline, and long-term maintenance considerations.
