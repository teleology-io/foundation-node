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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Foundation = Foundation;
const axios_1 = __importDefault(require("axios"));
const websocket_1 = require("websocket");
function Foundation({ url, apiKey, uid }) {
    let config;
    let environment;
    let variables = {};
    let callback;
    const socketUrl = `${url}/v1/realtime?apiKey=${apiKey}`.replace("http", "ws");
    const client = axios_1.default.create({
        baseURL: url,
        headers: {
            ['X-Api-Key']: apiKey
        },
    });
    client.interceptors.response.use((res) => res.data, (err) => undefined);
    function getEnvironment() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!environment) {
                environment = yield client({
                    url: '/v1/environment',
                    method: 'get'
                });
            }
            return environment;
        });
    }
    function getConfiguration() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!config) {
                const result = yield client({
                    url: '/v1/configuration',
                    method: 'get'
                });
                if (result.mime_type === 'application/json') {
                    config = JSON.parse(result.content);
                }
                else {
                    config = result.content;
                }
            }
            return config;
        });
    }
    function getVariable(name, fallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const found = variables[name];
            if (found) {
                return found.value;
            }
            const result = yield client({
                url: '/v1/variable',
                method: 'post',
                data: {
                    name,
                    uid,
                }
            });
            if (result) {
                variables[name] = result;
                return result.value;
            }
            return fallback;
        });
    }
    function subscribe(cb) {
        callback = cb;
    }
    function realtime(callback) {
        const ws = new websocket_1.w3cwebsocket(socketUrl);
        ws.onerror = () => ws.close();
        ws.onclose = () => {
            setTimeout(() => realtime(callback), 1000);
        };
        ws.onmessage = function (e) {
            if (typeof e.data === 'string') {
                try {
                    callback(JSON.parse(e === null || e === void 0 ? void 0 : e.data));
                }
                catch (err) {
                    callback(e.data);
                }
            }
        };
    }
    realtime((data) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        switch (data === null || data === void 0 ? void 0 : data.type) {
            case 'variable.updated': {
                const name = data.payload.name;
                delete variables[name];
                yield getVariable((_a = data === null || data === void 0 ? void 0 : data.payload) === null || _a === void 0 ? void 0 : _a.name);
                callback && callback(data.type, variables[name]);
                break;
            }
            case 'configuration.published': {
                config = undefined;
                callback && callback(data.type, yield getConfiguration());
                break;
            }
            case 'environment.updated': {
                environment = undefined;
                callback && callback(data.type, yield getEnvironment());
                break;
            }
        }
    }));
    return {
        getConfiguration,
        getEnvironment,
        getVariable,
        subscribe,
    };
}
