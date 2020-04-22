"use strict";
/*import { sql, SqlConfig } from './index';

export async function SqlInit(): Promise<void> {
    const sqlConfig: SqlConfig = {
        user: "TRANS_MARKET2",
        password: "TRANS_MARKET2",
        connectString: '192.168.201.22/TRANSM',
        externalAuth  : false
    };
    try {
    sql.init(sqlConfig);
    await sql.ConnectDB();
    }catch (error) {
        throw new Error(error);
    }

    // Test connection
    sql.close();
    try {
        
       var t= await sql.q(
            'SELECT "permission" FROM CMS_UserRoles WHERE CMS_UserRoles."userRoleId" = :P1','00000000-0000-0000-0000-000000000004'
        );
    } catch (error) {
        throw new Error(error);
    }
    var tuu=3
}

SqlInit();*/ 
//# sourceMappingURL=test.js.map