import * as osql from 'oracledb';
export declare type ResultSql = ({
    [column: string]: any;
})[];
export declare class SqlFactory {
    private static instance;
    protected pool: osql.Pool | undefined;
    protected config: osql.PoolAttributes | undefined;
    private constructor();
    static getInstance(): SqlFactory;
    init(config: osql.PoolAttributes): void;
    ConnectDB(): Promise<void>;
    close: () => void;
    /** Executes query and returns the result */
    query(sqlStr: string, ...params: Array<string | number | boolean>): Promise<ResultSql>;
    queryOne(sqlStr: string, ...params: Array<string | number | boolean>): Promise<any>;
    /** Alias to query */
    q: (sqlStr: string, ...params: (string | number | boolean)[]) => Promise<{
        [column: string]: any;
    }[]>;
    /** Alias to queryOne */
    q1: (sqlStr: string, ...params: (string | number | boolean)[]) => Promise<any>;
}
export interface SqlConfig extends osql.PoolAttributes {
}
export declare const sql: SqlFactory;
