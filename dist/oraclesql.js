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
                this.pool.close(0);
            this.pool = undefined;
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
        // @ts-ignore
        osql.autoCommit = true;
        // @ts-ignore
        osql.poolMax = 100;
        // @ts-ignore
        osql.fetchAsString = [osql.NUMBER];
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
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return Promise.resolve()
                    .then(() => __awaiter(this, void 0, void 0, function* () {
                    if (!this.config)
                        throw new Error('SQL not initialized. Use sql.init(config) first');
                    if (!this.pool) {
                        try {
                            yield this.ConnectDB();
                        }
                        catch (error) {
                            console.error('SQL Connection Error: ', error);
                            throw error;
                        }
                    }
                    else if (this.pool.status === osql.POOL_STATUS_OPEN) {
                        return this.pool;
                    }
                    else {
                        this.close();
                        try {
                            yield this.ConnectDB();
                        }
                        catch (error) {
                            console.error('SQL Connection Error: ', error);
                            throw error;
                        }
                    }
                }))
                    .then(_ => this.pool.getConnection())
                    .then((connection) => __awaiter(this, void 0, void 0, function* () {
                    let bindVars = {};
                    params.forEach((p, ix) => {
                        if (typeof p === 'boolean')
                            (p ? p = 1 : p = 0);
                        bindVars[`P${ix + 1}`] = { val: p };
                    });
                    let result = yield connection.execute(sqlStr, bindVars);
                    connection.close();
                    return result;
                }))
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
        });
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