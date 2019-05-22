"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const osql = require("oracledb");
class SqlFactory {
    constructor() {
        this.close = () => {
            if (this.pool)
                this.pool.close();
        };
        /** Alias to query */
        this.q = this.query;
        /** Alias to queryOne */
        this.q1 = this.queryOne;
        if (SqlFactory.instance)
            throw new Error('Instantiation failed. Use .getInstance() instead of new.');
        SqlFactory.instance = this;
    }
    static getInstance() {
        return SqlFactory.instance;
    }
    init(config) {
        this.config = config;
        // @ts-ignore
        osql.outFormat = osql.OBJECT;
    }
    ConnectDB() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.config)
                throw new Error('SQL config not initialized. Use sql.init(config) first');
            // mssql.outFormat = mssql.ARRAY;
            try {
                let pool = yield osql.createPool(this.config);
                this.pool = pool;
            }
            catch (err) {
                this.pool = undefined;
                throw new Error("createPool() error: " + err.message);
            }
        });
    }
    /** Executes query and returns the result */
    query(sqlStr, ...params) {
        try {
            return Promise.resolve()
                .then(() => {
                if (!this.pool) {
                    throw new Error('SQL not initialized. Use sql.init(config) first');
                }
                else if (this.pool.status === osql.POOL_STATUS_OPEN) {
                    return this.pool;
                }
                else {
                    this.pool.terminate();
                    this.ConnectDB().then(_ => this.pool)
                        .catch(error => {
                        console.error('SQL Connection Error: ', error);
                        throw error;
                    });
                }
            })
                .then(_ => this.pool.getConnection())
                .then(connection => {
                let paramType;
                let bindVars = {};
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
                    bindVars[`P${ix + 1}`] = { val: p };
                });
                return connection.execute(sqlStr, bindVars);
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
                console.error('SQL Query Error: ', error);
                throw error;
            });
        }
        catch (error) {
            console.error('SQL Execution Error: ', error);
            throw error;
        }
    }
    // Executes the query and returns the first record
    queryOne(sqlStr, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            const recordset = yield this.query(sqlStr, ...params);
            if (recordset.length) {
                return recordset[0];
            }
            else {
                return Promise.resolve(null);
            }
        });
    }
}
SqlFactory.instance = new SqlFactory();
exports.SqlFactory = SqlFactory;
// export function sqlInit(config: SqlConfig) {
//     SqlFactory.getInstance().init(config);
// }
// export function sql(sqlStr: string, params: Array<string | number | boolean> = []): Promise<mssql.IRecordSet<any>> {
//     return SqlFactory.getInstance().runSql(sqlStr, ...params);
// }
// export function sqlClose(): void {
//     SqlFactory.getInstance().closeConnection();
// }
exports.sql = SqlFactory.getInstance();
//# sourceMappingURL=oraclesql.js.map