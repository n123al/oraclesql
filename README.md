# Connect to an Oracle-SQL server and run queries using a simple API

A simple way to run SQL queries using Async/Await and Promises. This is not an ORM.  
It uses node-mssql under the hood

## Installation

```bash
npm install @n123al/oraclesql
```

## initialization

```typescript
import { SqlConfig, sqlInit } from '@n123al/oraclesql';
const sqlConfig: SqlConfig = {
    user: 'sa',
    password: 'password',
    server: 'localhost',
    database: 'AdventureWorks'
};
sqlInit(sqlConfig);
```

## Usage

> The first parameter is the SQL query to execute. Use @P1, @P2 for parameter values.
> the rest parameters are the values for the parameters (The first one will replace @P1, the second will replace @P2 and so on)

```typescript
import { sql } from '@n123al/oraclesql';
sql
    .query('SELECT * FROM USERS WHERE name like @P1 AND isActive = @P2', 'John%', true)
    .then(data => console.log(data))
    .catch(error => console.error(error));
```

### using Async / Await

```typescript
try {
    const data = await sql.query('SELECT * FROM USERS WHERE name like @P1 AND isActive = @P2', 'John%', true);
} catch (error) {
    console.log(error);
}
```

### Methods

*   sql.query (alias: sql.q): Executes query and returns an array with the results. Can be used for any query types
*   sql.queryOne (alias: sql.1): Executes the query and returns the first record, or null if there are no records
*   sql.insertReturnIdentity (alias: sql.ii): Can be used for INSERT. It will return the identity of the inserted record (i.e. SCOPE_IDENTITY()) or null
