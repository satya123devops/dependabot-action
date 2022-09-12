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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
var core = require("@actions/core");
// import execa = require('execa');
// import { context, getOctokit } from '@actions/github';
// import { combinePRs } from './utils/pull-requests';
var getInputs_1 = require("./utils/getInputs");
// import { repoPRFetch } from './utils/repoPRFetch'
var axios_1 = require("axios");
var handleError = function (err) {
    core.error(err);
    core.setFailed("Unhandled error: ".concat(err));
};
process.on('unhandledRejection', handleError);
function fetchPackageName(head_sha, base_sha, githubToken) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios_1["default"].get("https://api.github.com/repos/satya123devops/Code-Pipeline-Demo-After/dependency-graph/compare/".concat(base_sha, "...").concat(head_sha), {
                        headers: { Authorization: "Bearer ".concat(githubToken), Accept: 'application/json' }
                    })];
                case 1:
                    data = (_a.sent()).data;
                    return [2 /*return*/, data];
            }
        });
    });
}
;
function fetchIsMerged(number, githubToken) {
    return __awaiter(this, void 0, void 0, function () {
        var status_1, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1["default"].get("https://api.github.com/repos/satya123devops/Code-Pipeline-Demo-After/pulls/".concat(number, "/merge"), {
                            headers: { Authorization: "Bearer ".concat(githubToken), Accept: 'application/json' }
                        })];
                case 1:
                    status_1 = (_a.sent()).status;
                    if (status_1 === 204) {
                        return [2 /*return*/, true];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
;
function scenario1(openData, githubToken) {
    var openIndex = 0;
    openData.forEach(function (data) {
        var head_sha = data.head.sha;
        var base_sha = data.base.sha;
        var packageName = fetchPackageName(head_sha, base_sha, githubToken);
        packageName.then(function (packageData) {
            openIndex++;
            if (packageData.length > 0) {
                var packageJsonData = packageData.filter(function (data) {
                    return data.manifest == "package.json";
                });
                for (var _i = 0, packageJsonData_1 = packageJsonData; _i < packageJsonData_1.length; _i++) {
                    var data = packageJsonData_1[_i];
                    console.log("NAME = " + data.name + "," + " VERSION = " + data.version + "," +
                        " DEPENDABOT_CHANGE_TYPE = " + data.change_type + "," +
                        " SEVERITY = " + JSON.stringify(data.vulnerabilities));
                }
                if (openIndex === openData.length) {
                    console.log("Process Failed");
                }
            }
            else {
                console.log("Process Passed");
            }
        });
    });
}
function scenario2(closedData, githubToken) {
    var countSuccess = 0;
    var countFailed = 0;
    var mergingIndex = 0;
    if (closedData.length > 0) {
        closedData.forEach(function (data) {
            var mergeData = fetchIsMerged(data.number, githubToken);
            mergeData.then(function (merge) {
                mergingIndex++;
                if (merge === true) {
                    countSuccess++;
                }
                else {
                    countFailed++;
                }
                if (mergingIndex === closedData.length) {
                    if (closedData.length === countSuccess) {
                        console.log("Process Passed");
                    }
                    else {
                        console.log("Process Failed because " + countFailed + " PR is/are not merged");
                    }
                }
            });
        });
    }
    else {
        console.log("No closed Data found");
    }
}
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var combinePullsParams, githubToken, data, data_1, dependabotFilteredData, openData, closedData, e_1, err_2;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, (0, getInputs_1["default"])()];
            case 1:
                combinePullsParams = _c.sent();
                console.log(combinePullsParams);
                githubToken = combinePullsParams.githubToken;
                _c.label = 2;
            case 2:
                _c.trys.push([2, 10, , 11]);
                return [4 /*yield*/, axios_1["default"].get("".concat(process.env.GITHUB_API_URL, "/repos/").concat(process.env.GITHUB_REPOSITORY), {
                        headers: { Authorization: "Bearer ".concat(githubToken), Accept: 'application/json' }
                    })];
            case 3:
                data = (_c.sent()).data;
                console.log("process.env brnch is " + ((_a = process.env.GITHUB_REF) === null || _a === void 0 ? void 0 : _a.replace("refs/heads/", '')));
                console.log("default_branch is " + data.default_branch);
                if (!(data.default_branch === ((_b = process.env.GITHUB_REF) === null || _b === void 0 ? void 0 : _b.replace("refs/heads/", '')))) return [3 /*break*/, 8];
                _c.label = 4;
            case 4:
                _c.trys.push([4, 6, , 7]);
                return [4 /*yield*/, axios_1["default"].get("https://api.github.com/repos/satya123devops/Code-Pipeline-Demo-After/pulls?state=all", {
                        headers: { Authorization: "Bearer ".concat(githubToken), Accept: 'application/json' }
                    })];
            case 5:
                data_1 = (_c.sent()).data;
                if (data_1.length > 0) {
                    dependabotFilteredData = data_1.filter(function (data) {
                        return data.user.login.includes('dependabot');
                    });
                    if (dependabotFilteredData.length > 0) {
                        openData = dependabotFilteredData.filter(function (data) {
                            return data.state == 'open';
                        });
                        if (openData.length > 0) {
                            console.log("Open data found");
                            scenario1(openData, githubToken);
                        }
                        else {
                            console.log("No open data found");
                            closedData = dependabotFilteredData.filter(function (data) {
                                return data.state == 'closed';
                            });
                            scenario2(closedData, githubToken);
                        }
                    }
                    else {
                        console.log("No dependabot data found");
                    }
                }
                else {
                    console.log("No data found");
                }
                return [3 /*break*/, 7];
            case 6:
                e_1 = _c.sent();
                core.setFailed("combine-dependabot-pulls: ".concat(e_1.message));
                return [3 /*break*/, 7];
            case 7: return [3 /*break*/, 9];
            case 8:
                console.log("No main branch found");
                _c.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                err_2 = _c.sent();
                core.setFailed("combine-dependabot-branch: ".concat(err_2.message));
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); };
run()["catch"](handleError);
