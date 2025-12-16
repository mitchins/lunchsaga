"""
Kinglet Testing Utilities - TestClient and Mock classes
"""

import json


class TestClient:
    """Simple sync wrapper for testing Kinglet apps without HTTP/Wrangler overhead"""

    __test__ = False  # Tell pytest this is not a test class

    def __init__(self, app, base_url="https://testserver", env=None):
        self.app = app
        self.base_url = base_url.rstrip("/")
        self.env = env or {}

        # Enable test mode on the app if it's a Kinglet instance
        if hasattr(app, "test_mode"):
            app.test_mode = True

    def request(
        self, method: str, path: str, json_data=None, data=None, headers=None, **kwargs
    ):
        """Make a test request and return (status, headers, body)"""
        import asyncio

        return asyncio.run(
            self._async_request(method, path, json_data, data, headers, **kwargs)
        )

    def _prepare_request_data(self, json_data, data, headers, kwargs):
        """Prepare request headers and body content"""
        # Handle 'json' keyword argument (common in test APIs)
        if "json" in kwargs and json_data is None:
            json_data = kwargs.pop("json")

        # Prepare headers
        test_headers = {"content-type": "application/json"} if json_data else {}
        if headers:
            test_headers.update({k.lower(): v for k, v in headers.items()})

        # Prepare body
        body_content = ""
        if json_data is not None:
            body_content = json.dumps(json_data)
            test_headers["content-type"] = "application/json"
        elif data is not None:
            body_content = str(data)

        return test_headers, body_content

    def _serialize_response_content(self, content):
        """Serialize response content for test consumption"""
        if isinstance(content, dict | list):
            return json.dumps(content)
        return str(content) if content is not None else ""

    def _handle_kinglet_response(self, response):
        """Handle Kinglet Response objects"""
        if hasattr(response, "status") and hasattr(response, "content"):
            status = response.status
            headers = response.headers
            content = response.content
            body = self._serialize_response_content(content)
            return status, headers, body
        return None

    def _handle_raw_response(self, response):
        """Handle raw response objects (dict, string, etc.)"""
        if isinstance(response, dict):
            return 200, {}, json.dumps(response)
        elif isinstance(response, str):
            return 200, {}, response
        else:
            return 200, {}, str(response)

    async def _async_request(
        self, method: str, path: str, json_data=None, data=None, headers=None, **kwargs
    ):
        """Internal async request handler"""
        test_headers, body_content = self._prepare_request_data(
            json_data, data, headers, kwargs
        )
        url = f"{self.base_url}{path}"

        # Create mock objects
        mock_request = MockRequest(method, url, test_headers, body_content)
        mock_env = MockEnv(self.env)

        try:
            response = await self.app(mock_request, mock_env)

            # Try to handle as Kinglet Response first
            kinglet_result = self._handle_kinglet_response(response)
            if kinglet_result:
                return kinglet_result

            # Handle as raw response
            return self._handle_raw_response(response)

        except Exception as e:
            error_body = json.dumps({"error": str(e)})
            return 500, {}, error_body


class MockRequest:
    """Mock request object for testing that matches Workers request interface"""

    def __init__(self, method: str, url: str, headers: dict, body: str = ""):
        self.method = method
        self.url = url
        self.headers = MockHeaders(headers)
        self._body = body

    async def text(self):
        return self._body

    async def json(self):
        if self._body:
            return json.loads(self._body)
        return None


class MockHeaders:
    """Mock headers object that matches Workers headers interface"""

    def __init__(self, headers_dict):
        self._headers = {k.lower(): v for k, v in (headers_dict or {}).items()}

    def get(self, key, default=None):
        return self._headers.get(key.lower(), default)

    def items(self):
        return self._headers.items()

    def __iter__(self):
        return iter(self._headers.items())


class MockEnv:
    """Mock environment object for testing"""

    def __init__(self, env_dict):
        # Set defaults for common Cloudflare bindings
        self.DB = env_dict.get("DB", FaithfulMockD1Database())
        self.ENVIRONMENT = env_dict.get("ENVIRONMENT", "test")

        # Add any additional environment variables
        for key, value in env_dict.items():
            setattr(self, key, value)


class FaithfulMockD1Database:
    """
    Faithful mock of Cloudflare D1 database using SQLite in-memory
    
    Provides a transparent passthrough to SQLite for:
    - Full SQL support (JOINs, subqueries, aggregates, window functions, CTEs, etc.)
    - Mature, well-tested SQL engine
    - Transaction support (BEGIN, COMMIT, ROLLBACK)
    - D1-compatible result format
    
    This is a thin wrapper that delegates all SQL operations to SQLite.
    """

    def __init__(self):
        import sqlite3
        
        # Create in-memory SQLite database with D1-compatible settings
        self._conn = sqlite3.connect(':memory:', check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        
    def prepare(self, sql: str):
        """Prepare a SQL statement for execution"""
        return FaithfulMockQuery(sql, self)

    async def batch(self, statements: list):
        """Execute multiple statements in a batch"""
        results = []
        for stmt in statements:
            if hasattr(stmt, 'sql'):
                query = FaithfulMockQuery(stmt.sql, self)
                if hasattr(stmt, 'bindings'):
                    query.bindings = stmt.bindings
                results.append(await query.run())
            else:
                query = self.prepare(stmt)
                results.append(await query.run())
        return results

    async def exec(self, sql: str):
        """Execute raw SQL (for DDL statements like CREATE TABLE)"""
        query = FaithfulMockQuery(sql, self)
        return await query.run()
    
    def __del__(self):
        """Clean up SQLite connection on deletion"""
        if hasattr(self, '_conn'):
            self._conn.close()


class FaithfulMockQuery:
    """Mock of D1 prepared statement that delegates to SQLite"""

    def __init__(self, sql: str, database: FaithfulMockD1Database):
        self.sql = sql.strip()
        self.database = database
        self.bindings = []

    def bind(self, *args):
        """Bind parameters to the prepared statement"""
        self.bindings = list(args)
        return self

    async def run(self):
        """Execute the query and return D1-compatible result with metadata"""
        cursor = self.database._conn.cursor()
        try:
            cursor.execute(self.sql, self.bindings)
            self.database._conn.commit()
            
            # Return metadata for non-SELECT queries
            return MockResult({
                "changes": cursor.rowcount if cursor.rowcount >= 0 else 0,
                "last_row_id": cursor.lastrowid if cursor.lastrowid else 0,
                "rows_written": cursor.rowcount if cursor.rowcount >= 0 else 0,
                "rows_read": 0
            })
        except Exception as e:
            self.database._conn.rollback()
            raise
        finally:
            cursor.close()

    async def first(self):
        """Execute query and return first row as D1-compatible object"""
        cursor = self.database._conn.cursor()
        try:
            cursor.execute(self.sql, self.bindings)
            row = cursor.fetchone()
            if row:
                # Convert sqlite3.Row to dict
                return MockRow(dict(row))
            return None
        finally:
            cursor.close()

    async def all(self):
        """Execute query and return all rows as D1-compatible result"""
        cursor = self.database._conn.cursor()
        try:
            cursor.execute(self.sql, self.bindings)
            rows = cursor.fetchall()
            # Convert sqlite3.Row objects to dicts
            result_list = [dict(row) for row in rows]
            return MockResult(result_list)
        finally:
            cursor.close()


# Keep backward compatibility - MockDatabase is now an alias
MockDatabase = FaithfulMockD1Database


class MockQuery:
    """Mock D1 prepared statement (legacy - use FaithfulMockQuery)"""

    def __init__(self, sql: str, data: dict):
        self.sql = sql
        self.data = data
        self.bindings = []

    def bind(self, *args):
        self.bindings = args
        return self

    async def run(self):
        return MockResult({"changes": 1, "last_row_id": 1})

    async def first(self):
        return MockRow({"id": 1, "name": "Test"})

    async def all(self):
        return MockResult([{"id": 1, "name": "Test"}])



class MockRow:
    """Mock D1 row result with to_py() method"""

    def __init__(self, data):
        self.data = data

    def to_py(self):
        return self.data


class MockMeta:
    """Mock D1 result metadata with attribute access"""

    def __init__(self, data: dict):
        self.changes = data.get("changes", 0)
        self.last_row_id = data.get("last_row_id", 0)
        self.rows_written = data.get("rows_written", self.changes)
        self.rows_read = data.get("rows_read", 0)


class MockResult:
    """Mock D1 query result"""

    def __init__(self, data):
        if isinstance(data, dict):
            self.meta = MockMeta(data)
            self.results = []
        else:
            self.results = data
            self.meta = MockMeta({"changes": len(data), "rows_read": len(data)})
