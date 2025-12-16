# Kinglet 1.8.1 Features

This document describes the new features added in Kinglet 1.8.1 and how they improve testing capabilities for the LunchSaga application.

## New Features

### 1. Email Support with Amazon SES Integration

Kinglet 1.8.1 introduces comprehensive email support with both production (SES) and testing (Mock) implementations.

#### Components

- **`EmailMessage`**: Data class for email content (to, subject, body_text, body_html, etc.)
- **`EmailSendResult`**: Result object with success status, message_id, and error details
- **`MockEmailSender`**: Async mock email sender for testing
- **`SESEmailSender`**: Amazon SES integration for production
- **`get_email_sender(env, use_mock=None)`**: Factory function to get appropriate sender

#### MockEmailSender Features

The `MockEmailSender` provides rich testing capabilities:

- Captures all sent emails in memory for test assertions
- Supports bulk email sending
- Can simulate send failures for error testing
- Configurable artificial delays to test async behavior
- Helper methods: `get_sent_to(email)`, `get_latest_email()`, `clear()`

#### Usage Example

```python
from kinglet import get_email_sender, EmailMessage

# In production (uses SES)
email_sender = get_email_sender(env)

# In tests (uses Mock)
email_sender = get_email_sender(env, use_mock=True)

message = EmailMessage(
    to=["user@example.com"],
    subject="Welcome to LunchSaga",
    body_text="Plain text version",
    body_html="<h1>HTML version</h1>",
    from_address="noreply@lunchsaga.app"
)

result = await email_sender.send_email(message)
assert result.success
```

#### Integration in LunchSaga

The auth service now uses the email sender to send magic link codes:

```python
# api/src/domains/auth/service.py
from kinglet.email import EmailMessage, get_email_sender

async def send_magic_link(cls, db, email: str, env) -> dict:
    # ... generate code and token ...
    
    email_sender = get_email_sender(env)
    email_message = EmailMessage(
        to=[email],
        subject="Your LunchSaga Login Code",
        body_text=f"Your login code is: {code}",
        body_html=f"<p>Your login code is: <strong>{code}</strong></p>"
    )
    
    await email_sender.send_email(email_message)
```

### 2. Enhanced D1 Database Mocks

Kinglet 1.8.1 provides `FaithfulMockD1Database` - a more complete D1 mock implementation.

#### Features

- In-memory table storage with schema awareness
- SQL parsing for INSERT, SELECT, UPDATE, DELETE operations
- Prepared statement support with parameter binding
- Auto-increment ID handling
- Returns D1-compatible result objects

#### Components

- **`FaithfulMockD1Database`**: Main database mock
- **`FaithfulMockQuery`**: Prepared statement with SQL parsing
- **`MockMeta`**: Result metadata (changes, last_row_id, etc.)
- **`MockResult`**: Query result with meta and results
- **`MockRow`**: Row result with to_py() method

#### Usage Example

```python
from kinglet import FaithfulMockD1Database
from models import User

# Create mock database
db = FaithfulMockD1Database()
await User.create_table(db)

# Use with ORM
user = await User.objects.create(db, email="test@example.com", name="Test User")
found = await User.objects.filter(db, email="test@example.com").first()
```

#### Current Status

The D1 mock is functional for basic operations but has some limitations with complex SQL queries. It works well for:
- Simple INSERT statements with column lists
- Basic SELECT with WHERE clauses
- UPDATE and DELETE operations
- Auto-increment primary keys

**Note**: For complex queries or full integration testing, use the actual pywrangler dev environment. The mock is intended for fast unit tests of business logic.

## Testing Improvements

### No More PyWrangler for Unit Tests

With Kinglet 1.8.1, you can write fast unit tests without starting pywrangler:

**Before (Integration Test)**:
- Requires `uv` and `pywrangler`
- Starts miniflare server
- Slow startup (30-60 seconds)
- Full HTTP request/response cycle

**After (Unit Test with Kinglet 1.8.1)**:
- Pure Python, no external dependencies
- Instant startup
- Direct function calls
- Mock email and database

### Test Organization

```
api/tests/
├── conftest.py              # Integration test config (pywrangler)
├── test_api.py              # Integration tests (requires pywrangler)
├── test_workflows.py        # Integration tests
└── unit/
    ├── conftest.py          # Unit test config (no pywrangler)
    └── test_email_service.py    # Email module tests (16 tests, all passing)
```

### Running Tests

```bash
# Fast unit tests (no pywrangler needed) - 16 tests, all passing
python3 -m pytest api/tests/unit/ -v

# Integration tests (requires uv and pywrangler)
uv run pytest api/tests/ -v
```

## Test Coverage

Current test coverage with Kinglet 1.8.1 features:

- **Email Module**: Comprehensive test coverage (16 tests, 100% passing)
- **Auth Service**: Email integration working in production code
- **Models**: 100% coverage

### Coverage Highlights

- `python_modules/kinglet/email.py`: Full test coverage
  - MockEmailSender: All features tested
  - EmailMessage: Data structure tests
  - Factory function: All scenarios tested

- `api/src/domains/auth/service.py`: Email integration implemented
  - Email integration: ✅ Working
  - Magic link generation: ✅ Working
  - Production-ready email sending

**Note**: For comprehensive testing of auth service business logic with database operations, use the existing integration tests with pywrangler.

## Migration Guide

### Updating Existing Code

1. **Update pyproject.toml**:
   ```toml
   dependencies = [
       "kinglet>=1.8.1",
       ...
   ]
   ```

2. **Add Email Sending**:
   ```python
   from kinglet.email import EmailMessage, get_email_sender
   
   # Replace print statements or TODO comments with actual email sending
   email_sender = get_email_sender(env)
   await email_sender.send_email(EmailMessage(...))
   ```

3. **Write Unit Tests**:
   ```python
   from kinglet import FaithfulMockD1Database, MockEmailSender
   
   @pytest.fixture
   async def db():
       database = FaithfulMockD1Database()
       await MyModel.create_table(database)
       return database
   ```

## Benefits

1. **Faster Development**: Unit tests run instantly without server startup
2. **Better Testing**: Mock email sender captures emails for assertions
3. **Less Infrastructure**: No need for AWS SES in development/testing
4. **Improved Coverage**: Can test email flows without external dependencies
5. **Cleaner Code**: Replace print statements with proper email sending

## Future Enhancements

Potential improvements for future versions:

- More complete SQL parser for D1 mock
- Support for JOINs and subqueries
- Transaction support in D1 mock
- Email template system
- Attachment support for emails
- HTML email utilities

## Examples

See the test files for complete examples:
- `api/tests/unit/test_email_service.py` - Email module usage
- `api/src/domains/auth/service.py` - Email integration in production code
