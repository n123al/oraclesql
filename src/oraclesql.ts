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
        // @ts-ignore
        osql.autoCommit =true;
        // @ts-ignore
        osql.poolMax =100;
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

    public  close = () => {
        if (this.pool)  this.pool.close(0);
        this.pool = undefined;
    };

    /** Executes query and returns the result */
    public async query(sqlStr: string, ...params: Array<string | number | boolean | Date>): Promise <ResultSql> {
        try {
            return Promise.resolve()
                .then(async () => {
                    if(!this.config)throw new Error('SQL not initialized. Use sql.init(config) first');
                    if (!this.pool) {
                        try {
                            await this.ConnectDB();
                            
                        }
                        catch(error) {
                            console.error('SQL Connection Error: ', error );
                            throw error;
                        }
                    } else if (this.pool.status === osql.POOL_STATUS_OPEN) {
                        return this.pool;
                    } else  {
                        this.close();
                        try {
                            await this.ConnectDB();
                         
                        }
                        catch(error) {
                            console.error('SQL Connection Error: ', error );
                            throw error;
                        }
                     }
                })
                .then(_ => this.pool!.getConnection())
                .then(async connection => {
                    let bindVars:{[key:string]:{val:any}} ={};
                    params.forEach((p, ix) => {
                        if(typeof p === 'boolean')(p?p=1:p=0);
                        
                        bindVars[`P${ix + 1}`] = {val:p};
                    });

                       let result = await connection.execute(
                            sqlStr, bindVars)
                            connection.close();
                            return result;
                        
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
