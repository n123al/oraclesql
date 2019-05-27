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
const index_1 = require("./index");
function SqlInit() {
    return __awaiter(this, void 0, void 0, function* () {
        const sqlConfig = {
            user: "TRANS_MARKET2",
            password: "TRANS_MARKET2",
            connectString: '192.168.201.22/TRANSM',
            externalAuth: false
        };
        try {
            index_1.sql.init(sqlConfig);
            yield index_1.sql.ConnectDB();
        }
        catch (error) {
            throw new Error(error);
        }
        // Test connection
        index_1.sql.close();
        try {
            var t = yield index_1.sql.q('SELECT "permission" FROM CMS_UserRoles WHERE CMS_UserRoles."userRoleId" = :P1', '00000000-0000-0000-0000-000000000004');
        }
        catch (error) {
            throw new Error(error);
        }
        var tuu = 3;
    });
}
exports.SqlInit = SqlInit;
SqlInit();
//# sourceMappingURL=test.js.map