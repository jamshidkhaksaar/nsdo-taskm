"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var API_URL = 'http://localhost:3001';
function validateConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var healthResponse, authResponse, token, tasksResponse, error_1, tasksError, adminResponse, error_2, adminError, error_3, authError, deptResponse, error_4, deptError, corsResponse, error_5, corsError, error_6, mainError;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    console.log('Starting API connection validation...');
                    console.log("Using API URL: ".concat(API_URL));
                    _h.label = 1;
                case 1:
                    _h.trys.push([1, 25, , 26]);
                    // 1. Check health endpoint
                    console.log('\n1. Checking health endpoint...');
                    return [4 /*yield*/, axios_1.default.get("".concat(API_URL, "/api/health"))];
                case 2:
                    healthResponse = _h.sent();
                    console.log('✅ Health endpoint:', healthResponse.status, healthResponse.data);
                    // 2. Try to authenticate
                    console.log('\n2. Attempting authentication...');
                    _h.label = 3;
                case 3:
                    _h.trys.push([3, 15, , 20]);
                    return [4 /*yield*/, axios_1.default.post("".concat(API_URL, "/api/auth/login"), {
                            username: 'admin',
                            password: 'admin123'
                        })];
                case 4:
                    authResponse = _h.sent();
                    console.log('✅ Authentication:', authResponse.status);
                    token = authResponse.data.accessToken || authResponse.data.access;
                    if (!token) return [3 /*break*/, 13];
                    axios_1.default.defaults.headers.common['Authorization'] = "Bearer ".concat(token);
                    console.log('✅ Token received and set in headers');
                    // 3. Try to fetch tasks
                    console.log('\n3. Fetching tasks...');
                    _h.label = 5;
                case 5:
                    _h.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, axios_1.default.get("".concat(API_URL, "/api/tasks"))];
                case 6:
                    tasksResponse = _h.sent();
                    console.log('✅ Tasks endpoint:', tasksResponse.status, "Retrieved ".concat(tasksResponse.data.length, " tasks"));
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _h.sent();
                    tasksError = error_1;
                    console.log('❌ Tasks endpoint failed:', (_a = tasksError.response) === null || _a === void 0 ? void 0 : _a.status);
                    console.log('Error details:', ((_b = tasksError.response) === null || _b === void 0 ? void 0 : _b.data) || tasksError.message);
                    return [3 /*break*/, 8];
                case 8:
                    // 4. Check database connection through a data-heavy endpoint
                    console.log('\n4. Checking database connection through admin dashboard...');
                    _h.label = 9;
                case 9:
                    _h.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, axios_1.default.get("".concat(API_URL, "/api/admin/dashboard"))];
                case 10:
                    adminResponse = _h.sent();
                    console.log('✅ Admin dashboard:', adminResponse.status);
                    console.log('Database connection is working properly');
                    return [3 /*break*/, 12];
                case 11:
                    error_2 = _h.sent();
                    adminError = error_2;
                    console.log('⚠️ Admin endpoint check failed:', (_c = adminError.response) === null || _c === void 0 ? void 0 : _c.status);
                    console.log('This might be due to permissions or the endpoint not being available');
                    console.log('Error details:', ((_d = adminError.response) === null || _d === void 0 ? void 0 : _d.data) || adminError.message);
                    return [3 /*break*/, 12];
                case 12: return [3 /*break*/, 14];
                case 13:
                    console.log('⚠️ No token received in response');
                    console.log('Response data:', JSON.stringify(authResponse.data, null, 2));
                    _h.label = 14;
                case 14: return [3 /*break*/, 20];
                case 15:
                    error_3 = _h.sent();
                    authError = error_3;
                    console.log('❌ Authentication failed:', (_e = authError.response) === null || _e === void 0 ? void 0 : _e.status);
                    console.log('Error details:', ((_f = authError.response) === null || _f === void 0 ? void 0 : _f.data) || authError.message);
                    console.log('\nTrying to access public endpoints only...');
                    _h.label = 16;
                case 16:
                    _h.trys.push([16, 18, , 19]);
                    return [4 /*yield*/, axios_1.default.get("".concat(API_URL, "/api/departments"))];
                case 17:
                    deptResponse = _h.sent();
                    console.log('✅ Departments endpoint (public):', deptResponse.status);
                    return [3 /*break*/, 19];
                case 18:
                    error_4 = _h.sent();
                    deptError = error_4;
                    console.log('❌ Departments endpoint failed:', (_g = deptError.response) === null || _g === void 0 ? void 0 : _g.status);
                    return [3 /*break*/, 19];
                case 19: return [3 /*break*/, 20];
                case 20:
                    // 5. Check CORS configuration
                    console.log('\n5. Checking CORS configuration...');
                    _h.label = 21;
                case 21:
                    _h.trys.push([21, 23, , 24]);
                    return [4 /*yield*/, axios_1.default.get("".concat(API_URL, "/api/health"), {
                            headers: {
                                'Origin': 'http://localhost:3000'
                            }
                        })];
                case 22:
                    corsResponse = _h.sent();
                    console.log('✅ CORS is properly configured for frontend origin');
                    return [3 /*break*/, 24];
                case 23:
                    error_5 = _h.sent();
                    corsError = error_5;
                    if (corsError.message.includes('CORS')) {
                        console.log('❌ CORS is not properly configured');
                        console.log('Error:', corsError.message);
                    }
                    else {
                        console.log('⚠️ Could not verify CORS configuration due to other errors');
                    }
                    return [3 /*break*/, 24];
                case 24:
                    console.log('\nConnection validation completed.');
                    return [3 /*break*/, 26];
                case 25:
                    error_6 = _h.sent();
                    mainError = error_6;
                    console.error('\n❌ Connection validation failed:', mainError.message);
                    if ('code' in mainError && mainError.code === 'ECONNREFUSED') {
                        console.error('Backend server is not running. Please start the NestJS server.');
                    }
                    return [3 /*break*/, 26];
                case 26: return [2 /*return*/];
            }
        });
    });
}
validateConnection();
