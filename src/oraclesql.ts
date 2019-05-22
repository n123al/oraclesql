import * as mssql from 'oracledb';

export class SqlFactory {
    private static instance: SqlFactory = new SqlFactory();
    readonly connectionTimeout = 30000;
    protected pool: mssql.Pool | undefined;

    private timerReset = () => {
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(this.close, this.connectionTimeout);
    };
    private idleTimer: any;

    private constructor() {
        if (SqlFactory.instance) throw new Error('Instantiation failed. Use .getInstance() instead of new.');
        SqlFactory.instance = this;
    }

    public static getInstance(): SqlFactory {
        return SqlFactory.instance;
    }


    public init(config:mssql.PoolAttributes) {
        try {
            let pool = await mssql.createPool(config);
            this.pool =pool;
        } catch (err) {
            this.pool = undefined;
            throw new Error("createPool() error: " + err.message);
        }
    }

    public close = () => {
        if (this.pool) this.pool.close();
    };

    /** Executes query and returns the result */
    public query(sqlStr: string, ...params: Array<string | number | boolean>): Promise<any> {
        try {
            return Promise.resolve()
                .then(_ => {
                    if (!this.pool) {
                        throw 'SQL not initialized. Use sql.init(config) first';
                    } else if (this.pool.status === mssql.POOL_STATUS_OPEN) {
                        this.timerReset();
                        return this.pool;
                    } else if (this.pool.status === mssql.POOL_STATUS_OPEN) {
                        // wait up to 10 sec to connect
                        return new Promise((resolve, reject) => {
                            const handler = () => {
                                if (this.pool && this.pool.status === mssql.POOL_STATUS_OPEN) {
                                    clearInterval(waiting);
                                    this.timerReset();
                                    return resolve(this.pool);
                                }
                            };
                            const waiting = setInterval(handler, 100);
                            setTimeout(() => {
                                reject('Is taking too long to connect to database');
                            }, 10000);
                        });
                    } else {
                        this.idleTimer = setTimeout(this.close, this.connectionTimeout);
                        return this.pool..catch((error: any) => {
                            // // pool.connect() error:
                            // ELOGIN (ConnectionError) - Login failed.
                            // ETIMEOUT (ConnectionError) - Connection timeout.
                            // EALREADYCONNECTED (ConnectionError) - Database is already connected!
                            // EALREADYCONNECTING (ConnectionError) - Already connecting to database!
                            // EINSTLOOKUP (ConnectionError) - Instance lookup failed.
                            // ESOCKET (ConnectionError) - Socket error.
                            console.error('SQL Connection Error: ', error);
                            throw error;
                        });
                    }
                })
                .then(_ => new mssql.Request(this.pool))
                .then(request => {
                    var paramType ;
                    params.forEach((p, ix) => {
                        switch (typeof p) {
                            case 'string':
                                paramType = mssql.DB_TYPE_NVARCHAR;
                                break;
                            case 'boolean':
                                paramType = mssql.DB_TYPE_NUMBER;
                                break;
                            case 'number':
                                if (Number.isInteger(p as number)) {
                                    paramType = mssql.DB_TYPE_NUMBER;
                                } else {
                                    paramType = mssql.DB_TYPE_BINARY_FLOAT;
                                }
                                break;
                            default:
                                paramType = mssql.DB_TYPE_NVARCHAR;
                                break;
                        }
                        request.input(`P${ix + 1}`, paramType, p);
                    });
                    const resultSet = request.query(sqlStr);
                    return resultSet;
                })
                .then(resultSet => resultSet.recordset)
                .catch(error => {
                    // ETIMEOUT (RequestError) - Request timeout.
                    // EREQUEST (RequestError) - Message from SQL Server
                    // ECANCEL (RequestError) - Cancelled.
                    // ENOCONN (RequestError) - No connection is specified for that request.
                    // ENOTOPEN (ConnectionError) - Connection not yet open.
                    // ECONNCLOSED (ConnectionError) - Connection is closed.
                    // ENOTBEGUN (TransactionError) - Transaction has not begun.
                    // EABORT (TransactionError) - Transaction was aborted (by user or because of an error).
                    console.error('SQL Query Error: ', error);
                    throw error;
                });
        } catch (error) {
            console.error('SQL Execution Error: ', error);
            throw error;
        }
    }

    // Executes the query and returns the first record
    public async queryOne(sqlStr: string, ...params: Array<string | number | boolean>): Promise<any> {
        const recordset = await this.query(sqlStr, ...params);
        if (recordset.length) {
            return recordset[0];
        } else {
            return Promise.resolve(null);
        }
    }

    // Executes an Insert query and returns the identity of the record inserted
    public async insertReturnIdentity(
        sqlStr: string,
        ...params: Array<string | number | boolean>
    ): Promise<number | null> {
        sqlStr = `${sqlStr}; SELECT SCOPE_IDENTITY()`;
        const recordset = await this.query(sqlStr, ...params);
        if (recordset.length === 1 && recordset[0].hasOwnProperty('')) {
            return recordset[0][''];
        } else {
            return null;
        }
    }

    /** Alias to query */
    public q = this.query;

    /** Alias to queryOne */

    public q1 = this.queryOne;

    /** Alias to insertReturnIdentity */
    public ii = this.insertReturnIdentity;
}

export interface SqlConfig extends mssql.PoolAttributes {}

// export function sqlInit(config: SqlConfig) {
//     SqlFactory.getInstance().init(config);
// }

// export function sql(sqlStr: string, params: Array<string | number | boolean> = []): Promise<mssql.IRecordSet<any>> {
//     return SqlFactory.getInstance().runSql(sqlStr, ...params);
// }

// export function sqlClose(): void {
//     SqlFactory.getInstance().closeConnection();
// }

export const sql = SqlFactory.getInstance();
