import * as osql from 'oracledb';

export type ResultSql=
     (
         {
              [column: string]: any;
          }
     )[];


export class SqlFactory {
    private static instance: SqlFactory = new SqlFactory();
    protected pool: osql.Pool | undefined;
    protected config :osql.PoolAttributes |undefined;


    private constructor() {
        if (SqlFactory.instance) throw new Error('Instantiation failed. Use .getInstance() instead of new.');
        SqlFactory.instance = this;
    }

    public static getInstance(): SqlFactory {
        return SqlFactory.instance;
    }


    public init(config:osql.PoolAttributes) {
        this.config =config;
        // @ts-ignore
        osql.outFormat = osql.OBJECT;

    }

    public async ConnectDB(){
        if(!this.config)  throw  new Error ('SQL config not initialized. Use sql.init(config) first');
       // mssql.outFormat = mssql.ARRAY;
        try {
            let pool = await osql.createPool(this.config);
            this.pool = pool;
        } catch (err) {
            this.pool = undefined;
            throw new Error("createPool() error: " + err.message);
        }
    }

    public close = () => {
        if (this.pool) this.pool.close();
    };

    /** Executes query and returns the result */
    public query(sqlStr: string, ...params: Array<string | number | boolean>): Promise <ResultSql> {
        try {
            return Promise.resolve()
                .then(() => {
                    if (!this.pool) {
                        throw new Error('SQL not initialized. Use sql.init(config) first');
                    } else if (this.pool.status === osql.POOL_STATUS_OPEN) {
                        return this.pool;
                    } else  {
                        this.pool.terminate();
                        this.ConnectDB().then(_=> this.pool)
                        .catch(error => {
                            console.error('SQL Connection Error: ', error );
                            throw error;
                        });
                     }
                })
                .then(_ => this.pool!.getConnection())
                .then(connection => {
                    let paramType ;
                    let bindVars:{[key:string]:{val:any}} ={};
                    params.forEach((p, ix) => {
                        /*switch (typeof p) {
                            case 'string':
                                paramType = osql.DB_TYPE_VARCHAR;
                                break;
                            case 'boolean':
                                paramType = osql.DB_TYPE_NUMBER;
                                break;
                            case 'number':
                                if (Number.isInteger(p as number)) {
                                    paramType = osql.DB_TYPE_NUMBER;
                                } else {
                                    paramType = osql.DB_TYPE_BINARY_FLOAT;
                                }
                                break;
                            default:
                                paramType = osql.DB_TYPE_VARCHAR;
                                break;
                        }*/
                        bindVars[`P${ix + 1}`] = {val:p};
                    });
            
                       return connection.execute(
                            sqlStr, bindVars)
                        
                })
                .then(resultSet => resultSet.rows)
                .catch(error => {
                    // ETIMEOUT (RequestError) - Request timeout.
                    // EREQUEST (RequestError) - Message from SQL Server
                    // ECANCEL (RequestError) - Cancelled.
                    // ENOCONN (RequestError) - No connection is specified for that request.
                    // ENOTOPEN (ConnectionError) - Connection not yet open.
                    // ECONNCLOSED (ConnectionError) - Connection is closed.
                    // ENOTBEGUN (TransactionError) - Transaction has not begun.
                    // EABORT (TransactionError) - Transaction was aborted (by user or because of an error).
                    console.error('SQL Query Error: ', error );
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

    /** Alias to query */
    public q = this.query;

    /** Alias to queryOne */

    public q1 = this.queryOne;

}

export interface SqlConfig extends osql.PoolAttributes {}

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
