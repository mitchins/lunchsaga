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
    Faithful mock of Cloudflare D1 database for testing
    
    Provides a more complete implementation that:
    - Maintains in-memory tables with schema awareness
    - Supports basic SQL operations (INSERT, SELECT, UPDATE, DELETE)
    - Handles prepared statements with parameter binding
    - Provides transaction support
    - Returns results in D1-compatible format
    """

    def __init__(self):
        self._tables: dict[str, list[dict]] = {}
        self._schema: dict[str, dict[str, str]] = {}
        self._autoincrement_counters: dict[str, int] = {}
        self._in_transaction = False
        self._transaction_rollback_point: dict[str, list[dict]] | None = None

    def prepare(self, sql: str):
        """Prepare a SQL statement"""
        return FaithfulMockQuery(sql, self)

    def batch(self, statements: list):
        """Execute multiple statements in a batch"""
        results = []
        for stmt in statements:
            if hasattr(stmt, 'sql'):
                query = FaithfulMockQuery(stmt.sql, self)
                if hasattr(stmt, 'bindings'):
                    query.bindings = stmt.bindings
                results.append(query.run())
            else:
                query = self.prepare(stmt)
                results.append(query.run())
        return results

    def exec(self, sql: str):
        """Execute raw SQL (for DDL statements)"""
        # Simple DDL handling for CREATE TABLE
        if sql.strip().upper().startswith("CREATE TABLE"):
            self._handle_create_table(sql)
        return FaithfulMockQuery(sql, self).run()

    def _handle_create_table(self, sql: str):
        """Parse and handle CREATE TABLE statements"""
        import re

        # Extract table name
        match = re.search(r"CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)", sql, re.IGNORECASE)
        if match:
            table_name = match.group(1)
            if table_name not in self._tables:
                self._tables[table_name] = []
                self._schema[table_name] = {}
                self._autoincrement_counters[table_name] = 0  # Start from 0, will be incremented to 1

    def _get_or_create_table(self, table_name: str):
        """Get table or create if doesn't exist"""
        if table_name not in self._tables:
            self._tables[table_name] = []
            self._schema[table_name] = {}
            self._autoincrement_counters[table_name] = 0
        return self._tables[table_name]


class FaithfulMockQuery:
    """Faithful mock of D1 prepared statement with SQL parsing"""

    def __init__(self, sql: str, database: FaithfulMockD1Database):
        self.sql = sql.strip()
        self.database = database
        self.bindings = []

    def bind(self, *args):
        """Bind parameters to the query"""
        self.bindings = list(args)
        return self

    async def run(self):
        """Execute the query and return metadata"""
        result = self._execute()
        # Handle both dict (metadata) and list (SELECT results) responses
        if isinstance(result, dict):
            return MockResult(result)
        else:
            # For SELECT queries that return lists
            return MockResult(result if isinstance(result, list) else [])

    async def first(self):
        """Execute and return first row"""
        result = self._execute()
        if isinstance(result, list) and len(result) > 0:
            return MockRow(result[0])
        return None

    async def all(self):
        """Execute and return all rows"""
        result = self._execute()
        if isinstance(result, list):
            return MockResult(result)
        return MockResult([])

    def _execute(self):
        """Execute the SQL query"""
        sql_upper = self.sql.upper()

        if sql_upper.startswith("INSERT"):
            return self._handle_insert()
        elif sql_upper.startswith("SELECT"):
            return self._handle_select()
        elif sql_upper.startswith("UPDATE"):
            return self._handle_update()
        elif sql_upper.startswith("DELETE"):
            return self._handle_delete()
        else:
            # Default response for DDL (CREATE TABLE, etc.)
            if "CREATE TABLE" in sql_upper:
                self.database._handle_create_table(self.sql)
            return {"changes": 0, "last_row_id": 0}

    def _handle_insert(self):
        """Handle INSERT statements"""
        import re

        # Parse INSERT INTO table_name (...) VALUES (...)
        # Try with column names first
        match = re.search(
            r"INSERT\s+INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)",
            self.sql,
            re.IGNORECASE | re.DOTALL,
        )

        if match:
            table_name = match.group(1)
            columns_str = match.group(2)
            columns = [c.strip() for c in columns_str.split(",")]

            table = self.database._get_or_create_table(table_name)

            # Build new row from bindings
            new_row = {}
            for i, col in enumerate(columns):
                if i < len(self.bindings):
                    new_row[col] = self.bindings[i]
                else:
                    new_row[col] = None

            # Handle auto-increment ID
            # If id is provided but is 0 or None, generate a new ID
            if "id" in new_row:
                if new_row["id"] is None or new_row["id"] == 0:
                    self.database._autoincrement_counters[table_name] += 1
                    new_row["id"] = self.database._autoincrement_counters[table_name]
                # If a specific ID is provided, use it and update counter if necessary
                elif new_row["id"] >= self.database._autoincrement_counters[table_name]:
                    self.database._autoincrement_counters[table_name] = new_row["id"]
            else:
                # No id column, generate one
                self.database._autoincrement_counters[table_name] += 1
                new_row["id"] = self.database._autoincrement_counters[table_name]

            table.append(new_row)
            return {"changes": 1, "last_row_id": new_row.get("id", 0)}

        # Try without column names: INSERT INTO table VALUES (...)
        match = re.search(
            r"INSERT\s+INTO\s+(\w+)\s+VALUES\s*\((.*?)\)", self.sql, re.IGNORECASE | re.DOTALL
        )
        if match:
            table_name = match.group(1)
            table = self.database._get_or_create_table(table_name)
            
            # Assume bindings map to columns in order
            new_row = {}
            for i, val in enumerate(self.bindings):
                new_row[f"col{i}"] = val
            
            # Handle auto-increment ID
            if new_row.get("id") is None:
                self.database._autoincrement_counters[table_name] += 1
                new_row["id"] = self.database._autoincrement_counters[table_name]
            
            table.append(new_row)
            return {"changes": 1, "last_row_id": new_row.get("id", 0)}

        # If no pattern matched, return default
        return {"changes": 0, "last_row_id": 0}

    def _handle_select(self):
        """Handle SELECT statements"""
        import re

        # Parse SELECT ... FROM table_name WHERE ...
        match = re.search(r"FROM\s+(\w+)", self.sql, re.IGNORECASE)
        if not match:
            return []

        table_name = match.group(1)
        table = self.database._get_or_create_table(table_name)

        # Apply WHERE clause if present
        where_match = re.search(r"WHERE\s+(.+?)(?:ORDER BY|LIMIT|$)", self.sql, re.IGNORECASE)
        if where_match:
            where_clause = where_match.group(1).strip()
            filtered = self._apply_where_clause(table, where_clause)
        else:
            filtered = table.copy()

        # Apply ORDER BY if present
        order_match = re.search(r"ORDER BY\s+(\w+)(?:\s+(ASC|DESC))?", self.sql, re.IGNORECASE)
        if order_match:
            order_col = order_match.group(1)
            desc = order_match.group(2) and order_match.group(2).upper() == "DESC"
            filtered = sorted(filtered, key=lambda x: x.get(order_col, 0), reverse=desc)

        # Apply LIMIT if present
        limit_match = re.search(r"LIMIT\s+(\d+)", self.sql, re.IGNORECASE)
        if limit_match:
            limit = int(limit_match.group(1))
            filtered = filtered[:limit]

        return filtered

    def _handle_update(self):
        """Handle UPDATE statements"""
        import re

        # Parse UPDATE table_name SET ... WHERE ...
        match = re.search(r"UPDATE\s+(\w+)\s+SET\s+(.+?)(?:WHERE|$)", self.sql, re.IGNORECASE | re.DOTALL)
        if not match:
            return {"changes": 0}

        table_name = match.group(1)
        set_clause = match.group(2).strip()
        table = self.database._get_or_create_table(table_name)

        # Parse SET clause
        updates = {}
        set_parts = set_clause.split(",")
        binding_idx = 0
        for part in set_parts:
            if "=" in part:
                col, _ = part.split("=", 1)
                col = col.strip()
                if binding_idx < len(self.bindings):
                    updates[col] = self.bindings[binding_idx]
                    binding_idx += 1

        # Apply WHERE clause
        where_match = re.search(r"WHERE\s+(.+)", self.sql, re.IGNORECASE)
        if where_match:
            where_clause = where_match.group(1).strip()
            # Use remaining bindings for WHERE
            where_bindings = self.bindings[binding_idx:]
            rows_to_update = self._apply_where_clause(table, where_clause, where_bindings)
        else:
            rows_to_update = table

        # Update matching rows
        changes = 0
        for row in rows_to_update:
            for col, val in updates.items():
                row[col] = val
            changes += 1

        return {"changes": changes}

    def _handle_delete(self):
        """Handle DELETE statements"""
        import re

        # Parse DELETE FROM table_name WHERE ...
        match = re.search(r"DELETE FROM\s+(\w+)", self.sql, re.IGNORECASE)
        if not match:
            return {"changes": 0}

        table_name = match.group(1)
        table = self.database._get_or_create_table(table_name)

        # Apply WHERE clause
        where_match = re.search(r"WHERE\s+(.+)", self.sql, re.IGNORECASE)
        if where_match:
            where_clause = where_match.group(1).strip()
            rows_to_delete = self._apply_where_clause(table, where_clause)
            
            # Remove matching rows
            changes = 0
            for row in rows_to_delete:
                if row in table:
                    table.remove(row)
                    changes += 1
            return {"changes": changes}
        else:
            # Delete all rows
            changes = len(table)
            table.clear()
            return {"changes": changes}

    def _apply_where_clause(self, table, where_clause, bindings=None):
        """Apply WHERE clause filtering"""
        import re

        bindings = bindings or self.bindings
        filtered = []

        # Simple parsing for common WHERE patterns
        # Handle: column = ? or column = 'value'
        eq_match = re.search(r"(\w+)\s*=\s*\?", where_clause)
        if eq_match and bindings:
            col = eq_match.group(1)
            val = bindings[0]
            filtered = [row for row in table if row.get(col) == val]
        elif "AND" in where_clause.upper():
            # Handle multiple conditions with AND
            conditions = where_clause.split("AND")
            filtered = table.copy()
            binding_idx = 0
            for condition in conditions:
                eq_match = re.search(r"(\w+)\s*=\s*\?", condition)
                if eq_match and binding_idx < len(bindings):
                    col = eq_match.group(1)
                    val = bindings[binding_idx]
                    filtered = [row for row in filtered if row.get(col) == val]
                    binding_idx += 1
        else:
            # Default: return all rows
            filtered = table.copy()

        return filtered


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
