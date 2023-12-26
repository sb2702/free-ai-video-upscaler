var tflite_web_api_ModuleFactory = (function () {
    var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;

    return (
        function (tflite_web_api_ModuleFactory) {
            tflite_web_api_ModuleFactory = tflite_web_api_ModuleFactory || {};

            var Module = typeof tflite_web_api_ModuleFactory !== "undefined" ? tflite_web_api_ModuleFactory : {};
            var readyPromiseResolve, readyPromiseReject;
            Module["ready"] = new Promise(function (resolve, reject) {
                readyPromiseResolve = resolve;
                readyPromiseReject = reject
            });
            var moduleOverrides = {};
            var key;
            for (key in Module) {
                if (Module.hasOwnProperty(key)) {
                    moduleOverrides[key] = Module[key]
                }
            }
            var arguments_ = [];
            var thisProgram = "./this.program";
            var quit_ = function (status, toThrow) {
                throw toThrow
            };
            var ENVIRONMENT_IS_WEB = false;
            var ENVIRONMENT_IS_WORKER = false;
            var ENVIRONMENT_IS_NODE = false;
            var ENVIRONMENT_IS_SHELL = false;
            ENVIRONMENT_IS_WEB = typeof window === "object";
            ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
            ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
            ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
            var scriptDirectory = "";

            function locateFile(path) {
                if (Module["locateFile"]) {
                    return Module["locateFile"](path, scriptDirectory)
                }
                return scriptDirectory + path
            }

            var read_, readAsync, readBinary, setWindowTitle;
            if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
                if (ENVIRONMENT_IS_WORKER) {
                    scriptDirectory = self.location.href
                } else if (typeof document !== "undefined" && document.currentScript) {
                    scriptDirectory = document.currentScript.src
                }
                if (_scriptDir) {
                    scriptDirectory = _scriptDir
                }
                if (scriptDirectory.indexOf("blob:") !== 0) {
                    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
                } else {
                    scriptDirectory = ""
                }
                {
                    read_ = function (url) {
                        var xhr = new XMLHttpRequest;
                        xhr.open("GET", url, false);
                        xhr.send(null);
                        return xhr.responseText
                    };
                    if (ENVIRONMENT_IS_WORKER) {
                        readBinary = function (url) {
                            var xhr = new XMLHttpRequest;
                            xhr.open("GET", url, false);
                            xhr.responseType = "arraybuffer";
                            xhr.send(null);
                            return new Uint8Array(xhr.response)
                        }
                    }
                    readAsync = function (url, onload, onerror) {
                        var xhr = new XMLHttpRequest;
                        xhr.open("GET", url, true);
                        xhr.responseType = "arraybuffer";
                        xhr.onload = function () {
                            if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                                onload(xhr.response);
                                return
                            }
                            onerror()
                        };
                        xhr.onerror = onerror;
                        xhr.send(null)
                    }
                }
                setWindowTitle = function (title) {
                    document.title = title
                }
            } else {
            }
            var out = Module["print"] || function () {
            };
            var err = function (){};
            for (key in moduleOverrides) {
                if (moduleOverrides.hasOwnProperty(key)) {
                    Module[key] = moduleOverrides[key]
                }
            }
            moduleOverrides = null;
            if (Module["arguments"]) arguments_ = Module["arguments"];
            if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
            if (Module["quit"]) quit_ = Module["quit"];
            var tempRet0 = 0;
            var setTempRet0 = function (value) {
                tempRet0 = value
            };
            var wasmBinary;
            if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
            var noExitRuntime = Module["noExitRuntime"] || true;
            if (typeof WebAssembly !== "object") {
                abort("no native wasm support detected")
            }
            var wasmMemory;
            var ABORT = false;
            var EXITSTATUS;

            function assert(condition, text) {
                if (!condition) {
                    abort("Assertion failed: " + text)
                }
            }

            var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

            function UTF8ArrayToString(heap, idx, maxBytesToRead) {
                var endIdx = idx + maxBytesToRead;
                var endPtr = idx;
                while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
                if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
                    return UTF8Decoder.decode(heap.subarray(idx, endPtr))
                } else {
                    var str = "";
                    while (idx < endPtr) {
                        var u0 = heap[idx++];
                        if (!(u0 & 128)) {
                            str += String.fromCharCode(u0);
                            continue
                        }
                        var u1 = heap[idx++] & 63;
                        if ((u0 & 224) == 192) {
                            str += String.fromCharCode((u0 & 31) << 6 | u1);
                            continue
                        }
                        var u2 = heap[idx++] & 63;
                        if ((u0 & 240) == 224) {
                            u0 = (u0 & 15) << 12 | u1 << 6 | u2
                        } else {
                            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63
                        }
                        if (u0 < 65536) {
                            str += String.fromCharCode(u0)
                        } else {
                            var ch = u0 - 65536;
                            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
                        }
                    }
                }
                return str
            }

            function UTF8ToString(ptr, maxBytesToRead) {
                return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
            }

            function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
                if (!(maxBytesToWrite > 0)) return 0;
                var startIdx = outIdx;
                var endIdx = outIdx + maxBytesToWrite - 1;
                for (var i = 0; i < str.length; ++i) {
                    var u = str.charCodeAt(i);
                    if (u >= 55296 && u <= 57343) {
                        var u1 = str.charCodeAt(++i);
                        u = 65536 + ((u & 1023) << 10) | u1 & 1023
                    }
                    if (u <= 127) {
                        if (outIdx >= endIdx) break;
                        heap[outIdx++] = u
                    } else if (u <= 2047) {
                        if (outIdx + 1 >= endIdx) break;
                        heap[outIdx++] = 192 | u >> 6;
                        heap[outIdx++] = 128 | u & 63
                    } else if (u <= 65535) {
                        if (outIdx + 2 >= endIdx) break;
                        heap[outIdx++] = 224 | u >> 12;
                        heap[outIdx++] = 128 | u >> 6 & 63;
                        heap[outIdx++] = 128 | u & 63
                    } else {
                        if (outIdx + 3 >= endIdx) break;
                        heap[outIdx++] = 240 | u >> 18;
                        heap[outIdx++] = 128 | u >> 12 & 63;
                        heap[outIdx++] = 128 | u >> 6 & 63;
                        heap[outIdx++] = 128 | u & 63
                    }
                }
                heap[outIdx] = 0;
                return outIdx - startIdx
            }

            function stringToUTF8(str, outPtr, maxBytesToWrite) {
                return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
            }

            function lengthBytesUTF8(str) {
                var len = 0;
                for (var i = 0; i < str.length; ++i) {
                    var u = str.charCodeAt(i);
                    if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
                    if (u <= 127) ++len; else if (u <= 2047) len += 2; else if (u <= 65535) len += 3; else len += 4
                }
                return len
            }

            var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

            function UTF16ToString(ptr, maxBytesToRead) {
                var endPtr = ptr;
                var idx = endPtr >> 1;
                var maxIdx = idx + maxBytesToRead / 2;
                while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
                endPtr = idx << 1;
                if (endPtr - ptr > 32 && UTF16Decoder) {
                    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr))
                } else {
                    var str = "";
                    for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
                        var codeUnit = HEAP16[ptr + i * 2 >> 1];
                        if (codeUnit == 0) break;
                        str += String.fromCharCode(codeUnit)
                    }
                    return str
                }
            }

            function stringToUTF16(str, outPtr, maxBytesToWrite) {
                if (maxBytesToWrite === undefined) {
                    maxBytesToWrite = 2147483647
                }
                if (maxBytesToWrite < 2) return 0;
                maxBytesToWrite -= 2;
                var startPtr = outPtr;
                var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
                for (var i = 0; i < numCharsToWrite; ++i) {
                    var codeUnit = str.charCodeAt(i);
                    HEAP16[outPtr >> 1] = codeUnit;
                    outPtr += 2
                }
                HEAP16[outPtr >> 1] = 0;
                return outPtr - startPtr
            }

            function lengthBytesUTF16(str) {
                return str.length * 2
            }

            function UTF32ToString(ptr, maxBytesToRead) {
                var i = 0;
                var str = "";
                while (!(i >= maxBytesToRead / 4)) {
                    var utf32 = HEAP32[ptr + i * 4 >> 2];
                    if (utf32 == 0) break;
                    ++i;
                    if (utf32 >= 65536) {
                        var ch = utf32 - 65536;
                        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
                    } else {
                        str += String.fromCharCode(utf32)
                    }
                }
                return str
            }

            function stringToUTF32(str, outPtr, maxBytesToWrite) {
                if (maxBytesToWrite === undefined) {
                    maxBytesToWrite = 2147483647
                }
                if (maxBytesToWrite < 4) return 0;
                var startPtr = outPtr;
                var endPtr = startPtr + maxBytesToWrite - 4;
                for (var i = 0; i < str.length; ++i) {
                    var codeUnit = str.charCodeAt(i);
                    if (codeUnit >= 55296 && codeUnit <= 57343) {
                        var trailSurrogate = str.charCodeAt(++i);
                        codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023
                    }
                    HEAP32[outPtr >> 2] = codeUnit;
                    outPtr += 4;
                    if (outPtr + 4 > endPtr) break
                }
                HEAP32[outPtr >> 2] = 0;
                return outPtr - startPtr
            }

            function lengthBytesUTF32(str) {
                var len = 0;
                for (var i = 0; i < str.length; ++i) {
                    var codeUnit = str.charCodeAt(i);
                    if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
                    len += 4
                }
                return len
            }

            function allocateUTF8(str) {
                var size = lengthBytesUTF8(str) + 1;
                var ret = _malloc(size);
                if (ret) stringToUTF8Array(str, HEAP8, ret, size);
                return ret
            }

            function writeArrayToMemory(array, buffer) {
                HEAP8.set(array, buffer)
            }

            function writeAsciiToMemory(str, buffer, dontAddNull) {
                for (var i = 0; i < str.length; ++i) {
                    HEAP8[buffer++ >> 0] = str.charCodeAt(i)
                }
                if (!dontAddNull) HEAP8[buffer >> 0] = 0
            }

            function alignUp(x, multiple) {
                if (x % multiple > 0) {
                    x += multiple - x % multiple
                }
                return x
            }

            var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

            function updateGlobalBufferAndViews(buf) {
                buffer = buf;
                Module["HEAP8"] = HEAP8 = new Int8Array(buf);
                Module["HEAP16"] = HEAP16 = new Int16Array(buf);
                Module["HEAP32"] = HEAP32 = new Int32Array(buf);
                Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
                Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
                Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
                Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
                Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
            }

            var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 33554432;
            var wasmTable;
            var __ATPRERUN__ = [];
            var __ATINIT__ = [];
            var __ATMAIN__ = [];
            var __ATPOSTRUN__ = [];
            var runtimeInitialized = false;
            var runtimeExited = false;

            function preRun() {
                if (Module["preRun"]) {
                    if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
                    while (Module["preRun"].length) {
                        addOnPreRun(Module["preRun"].shift())
                    }
                }
                callRuntimeCallbacks(__ATPRERUN__)
            }

            function initRuntime() {
                runtimeInitialized = true;
                callRuntimeCallbacks(__ATINIT__)
            }

            function preMain() {
                callRuntimeCallbacks(__ATMAIN__)
            }

            function exitRuntime() {
                runtimeExited = true
            }

            function postRun() {
                if (Module["postRun"]) {
                    if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
                    while (Module["postRun"].length) {
                        addOnPostRun(Module["postRun"].shift())
                    }
                }
                callRuntimeCallbacks(__ATPOSTRUN__)
            }

            function addOnPreRun(cb) {
                __ATPRERUN__.unshift(cb)
            }

            function addOnInit(cb) {
                __ATINIT__.unshift(cb)
            }

            function addOnPostRun(cb) {
                __ATPOSTRUN__.unshift(cb)
            }

            var runDependencies = 0;
            var runDependencyWatcher = null;
            var dependenciesFulfilled = null;

            function addRunDependency(id) {
                runDependencies++;
                if (Module["monitorRunDependencies"]) {
                    Module["monitorRunDependencies"](runDependencies)
                }
            }

            function removeRunDependency(id) {
                runDependencies--;
                if (Module["monitorRunDependencies"]) {
                    Module["monitorRunDependencies"](runDependencies)
                }
                if (runDependencies == 0) {
                    if (runDependencyWatcher !== null) {
                        clearInterval(runDependencyWatcher);
                        runDependencyWatcher = null
                    }
                    if (dependenciesFulfilled) {
                        var callback = dependenciesFulfilled;
                        dependenciesFulfilled = null;
                        callback()
                    }
                }
            }

            Module["preloadedImages"] = {};
            Module["preloadedAudios"] = {};

            function abort(what) {
                if (Module["onAbort"]) {
                    Module["onAbort"](what)
                }
                what += "";
                err(what);
                ABORT = true;
                EXITSTATUS = 1;
                what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
                var e = new WebAssembly.RuntimeError(what);
                readyPromiseReject(e);
                throw e
            }

            function hasPrefix(str, prefix) {
                return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0
            }

            var dataURIPrefix = "data:application/octet-stream;base64,";

            function isDataURI(filename) {
                return hasPrefix(filename, dataURIPrefix)
            }

            var wasmBinaryFile = "tflite_web_api_cc_simd.wasm";
            if (!isDataURI(wasmBinaryFile)) {
                wasmBinaryFile = locateFile(wasmBinaryFile)
            }

            function getBinary(file) {
                try {
                    if (file == wasmBinaryFile && wasmBinary) {
                        return new Uint8Array(wasmBinary)
                    }
                    if (readBinary) {
                        return readBinary(file)
                    } else {
                        throw"both async and sync fetching of the wasm failed"
                    }
                } catch (err) {
                    abort(err)
                }
            }

            function getBinaryPromise() {
                if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
                    if (typeof fetch === "function") {
                        return fetch(wasmBinaryFile, {credentials: "same-origin"}).then(function (response) {
                            if (!response["ok"]) {
                                throw"failed to load wasm binary file at '" + wasmBinaryFile + "'"
                            }
                            return response["arrayBuffer"]()
                        }).catch(function () {
                            return getBinary(wasmBinaryFile)
                        })
                    }
                }
                return Promise.resolve().then(function () {
                    return getBinary(wasmBinaryFile)
                })
            }

            function createWasm() {
                var info = {"a": asmLibraryArg};

                function receiveInstance(instance, module) {
                    var exports = instance.exports;
                    Module["asm"] = exports;
                    wasmMemory = Module["asm"]["fa"];
                    updateGlobalBufferAndViews(wasmMemory.buffer);
                    wasmTable = Module["asm"]["ja"];
                    addOnInit(Module["asm"]["ga"]);
                    removeRunDependency("wasm-instantiate")
                }

                addRunDependency("wasm-instantiate");

                function receiveInstantiatedSource(output) {
                    receiveInstance(output["instance"])
                }

                function instantiateArrayBuffer(receiver) {
                    return getBinaryPromise().then(function (binary) {
                        var result = WebAssembly.instantiate(binary, info);
                        return result
                    }).then(receiver, function (reason) {
                        err("failed to asynchronously prepare wasm: " + reason);
                        abort(reason)
                    })
                }

                function instantiateAsync() {
                    if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
                        return fetch(wasmBinaryFile, {credentials: "same-origin"}).then(function (response) {
                            var result = WebAssembly.instantiateStreaming(response, info);
                            return result.then(receiveInstantiatedSource, function (reason) {
                                err("wasm streaming compile failed: " + reason);
                                err("falling back to ArrayBuffer instantiation");
                                return instantiateArrayBuffer(receiveInstantiatedSource)
                            })
                        })
                    } else {
                        return instantiateArrayBuffer(receiveInstantiatedSource)
                    }
                }

                if (Module["instantiateWasm"]) {
                    try {
                        var exports = Module["instantiateWasm"](info, receiveInstance);
                        return exports
                    } catch (e) {
                        err("Module.instantiateWasm callback failed with error: " + e);
                        return false
                    }
                }
                instantiateAsync().catch(readyPromiseReject);
                return {}
            }

            function callRuntimeCallbacks(callbacks) {
                while (callbacks.length > 0) {
                    var callback = callbacks.shift();
                    if (typeof callback == "function") {
                        callback(Module);
                        continue
                    }
                    var func = callback.func;
                    if (typeof func === "number") {
                        if (callback.arg === undefined) {
                            wasmTable.get(func)()
                        } else {
                            wasmTable.get(func)(callback.arg)
                        }
                    } else {
                        func(callback.arg === undefined ? null : callback.arg)
                    }
                }
            }

            var runtimeKeepaliveCounter = 0;

            function keepRuntimeAlive() {
                return noExitRuntime || runtimeKeepaliveCounter > 0
            }

            function setErrNo(value) {
                HEAP32[___errno_location() >> 2] = value;
                return value
            }

            var SYSCALLS = {
                mappings: {}, buffers: [null, [], []], printChar: function (stream, curr) {

                }, varargs: undefined, get: function () {
                    SYSCALLS.varargs += 4;
                    var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
                    return ret
                }, getStr: function (ptr) {
                    var ret = UTF8ToString(ptr);
                    return ret
                }, get64: function (low, high) {
                    return low
                }
            };

            function ___sys_fcntl64(fd, cmd, varargs) {
                SYSCALLS.varargs = varargs;
                return 0
            }

            function ___sys_ioctl(fd, op, varargs) {
                SYSCALLS.varargs = varargs;
                return 0
            }

            function syscallMmap2(addr, len, prot, flags, fd, off) {
                off <<= 12;
                var ptr;
                var allocated = false;
                if ((flags & 16) !== 0 && addr % 16384 !== 0) {
                    return -28
                }
                if ((flags & 32) !== 0) {
                    ptr = _memalign(16384, len);
                    if (!ptr) return -48;
                    _memset(ptr, 0, len);
                    allocated = true
                } else {
                    return -52
                }
                SYSCALLS.mappings[ptr] = {
                    malloc: ptr,
                    len: len,
                    allocated: allocated,
                    fd: fd,
                    prot: prot,
                    flags: flags,
                    offset: off
                };
                return ptr
            }

            function ___sys_mmap2(addr, len, prot, flags, fd, off) {
                return syscallMmap2(addr, len, prot, flags, fd, off)
            }

            function syscallMunmap(addr, len) {
                if ((addr | 0) === -1 || len === 0) {
                    return -28
                }
                var info = SYSCALLS.mappings[addr];
                if (!info) return 0;
                if (len === info.len) {
                    SYSCALLS.mappings[addr] = null;
                    if (info.allocated) {
                        _free(info.malloc)
                    }
                }
                return 0
            }

            function ___sys_munmap(addr, len) {
                return syscallMunmap(addr, len)
            }

            function ___sys_open(path, flags, varargs) {
                SYSCALLS.varargs = varargs
            }

            var structRegistrations = {};

            function runDestructors(destructors) {
                while (destructors.length) {
                    var ptr = destructors.pop();
                    var del = destructors.pop();
                    del(ptr)
                }
            }

            function simpleReadValueFromPointer(pointer) {
                return this["fromWireType"](HEAPU32[pointer >> 2])
            }

            var awaitingDependencies = {};
            var registeredTypes = {};
            var typeDependencies = {};
            var char_0 = 48;
            var char_9 = 57;

            function makeLegalFunctionName(name) {
                if (undefined === name) {
                    return "_unknown"
                }
                name = name.replace(/[^a-zA-Z0-9_]/g, "$");
                var f = name.charCodeAt(0);
                if (f >= char_0 && f <= char_9) {
                    return "_" + name
                } else {
                    return name
                }
            }

            function createNamedFunction(name, body) {
                name = makeLegalFunctionName(name);
                return new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n")(body)
            }

            function extendError(baseErrorType, errorName) {
                var errorClass = createNamedFunction(errorName, function (message) {
                    this.name = errorName;
                    this.message = message;
                    var stack = new Error(message).stack;
                    if (stack !== undefined) {
                        this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "")
                    }
                });
                errorClass.prototype = Object.create(baseErrorType.prototype);
                errorClass.prototype.constructor = errorClass;
                errorClass.prototype.toString = function () {
                    if (this.message === undefined) {
                        return this.name
                    } else {
                        return this.name + ": " + this.message
                    }
                };
                return errorClass
            }

            var InternalError = undefined;

            function throwInternalError(message) {
                throw new InternalError(message)
            }

            function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
                myTypes.forEach(function (type) {
                    typeDependencies[type] = dependentTypes
                });

                function onComplete(typeConverters) {
                    var myTypeConverters = getTypeConverters(typeConverters);
                    if (myTypeConverters.length !== myTypes.length) {
                        throwInternalError("Mismatched type converter count")
                    }
                    for (var i = 0; i < myTypes.length; ++i) {
                        registerType(myTypes[i], myTypeConverters[i])
                    }
                }

                var typeConverters = new Array(dependentTypes.length);
                var unregisteredTypes = [];
                var registered = 0;
                dependentTypes.forEach(function (dt, i) {
                    if (registeredTypes.hasOwnProperty(dt)) {
                        typeConverters[i] = registeredTypes[dt]
                    } else {
                        unregisteredTypes.push(dt);
                        if (!awaitingDependencies.hasOwnProperty(dt)) {
                            awaitingDependencies[dt] = []
                        }
                        awaitingDependencies[dt].push(function () {
                            typeConverters[i] = registeredTypes[dt];
                            ++registered;
                            if (registered === unregisteredTypes.length) {
                                onComplete(typeConverters)
                            }
                        })
                    }
                });
                if (0 === unregisteredTypes.length) {
                    onComplete(typeConverters)
                }
            }

            function __embind_finalize_value_object(structType) {
                var reg = structRegistrations[structType];
                delete structRegistrations[structType];
                var rawConstructor = reg.rawConstructor;
                var rawDestructor = reg.rawDestructor;
                var fieldRecords = reg.fields;
                var fieldTypes = fieldRecords.map(function (field) {
                    return field.getterReturnType
                }).concat(fieldRecords.map(function (field) {
                    return field.setterArgumentType
                }));
                whenDependentTypesAreResolved([structType], fieldTypes, function (fieldTypes) {
                    var fields = {};
                    fieldRecords.forEach(function (field, i) {
                        var fieldName = field.fieldName;
                        var getterReturnType = fieldTypes[i];
                        var getter = field.getter;
                        var getterContext = field.getterContext;
                        var setterArgumentType = fieldTypes[i + fieldRecords.length];
                        var setter = field.setter;
                        var setterContext = field.setterContext;
                        fields[fieldName] = {
                            read: function (ptr) {
                                return getterReturnType["fromWireType"](getter(getterContext, ptr))
                            }, write: function (ptr, o) {
                                var destructors = [];
                                setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
                                runDestructors(destructors)
                            }
                        }
                    });
                    return [{
                        name: reg.name,
                        "fromWireType": function (ptr) {
                            var rv = {};
                            for (var i in fields) {
                                rv[i] = fields[i].read(ptr)
                            }
                            rawDestructor(ptr);
                            return rv
                        },
                        "toWireType": function (destructors, o) {
                            for (var fieldName in fields) {
                                if (!(fieldName in o)) {
                                    throw new TypeError('Missing field:  "' + fieldName + '"')
                                }
                            }
                            var ptr = rawConstructor();
                            for (fieldName in fields) {
                                fields[fieldName].write(ptr, o[fieldName])
                            }
                            if (destructors !== null) {
                                destructors.push(rawDestructor, ptr)
                            }
                            return ptr
                        },
                        "argPackAdvance": 8,
                        "readValueFromPointer": simpleReadValueFromPointer,
                        destructorFunction: rawDestructor
                    }]
                })
            }

            function getShiftFromSize(size) {
                switch (size) {
                    case 1:
                        return 0;
                    case 2:
                        return 1;
                    case 4:
                        return 2;
                    case 8:
                        return 3;
                    default:
                        throw new TypeError("Unknown type size: " + size)
                }
            }

            function embind_init_charCodes() {
                var codes = new Array(256);
                for (var i = 0; i < 256; ++i) {
                    codes[i] = String.fromCharCode(i)
                }
                embind_charCodes = codes
            }

            var embind_charCodes = undefined;

            function readLatin1String(ptr) {
                var ret = "";
                var c = ptr;
                while (HEAPU8[c]) {
                    ret += embind_charCodes[HEAPU8[c++]]
                }
                return ret
            }

            var BindingError = undefined;

            function throwBindingError(message) {
                throw new BindingError(message)
            }

            function registerType(rawType, registeredInstance, options) {
                options = options || {};
                if (!("argPackAdvance" in registeredInstance)) {
                    throw new TypeError("registerType registeredInstance requires argPackAdvance")
                }
                var name = registeredInstance.name;
                if (!rawType) {
                    throwBindingError('type "' + name + '" must have a positive integer typeid pointer')
                }
                if (registeredTypes.hasOwnProperty(rawType)) {
                    if (options.ignoreDuplicateRegistrations) {
                        return
                    } else {
                        throwBindingError("Cannot register type '" + name + "' twice")
                    }
                }
                registeredTypes[rawType] = registeredInstance;
                delete typeDependencies[rawType];
                if (awaitingDependencies.hasOwnProperty(rawType)) {
                    var callbacks = awaitingDependencies[rawType];
                    delete awaitingDependencies[rawType];
                    callbacks.forEach(function (cb) {
                        cb()
                    })
                }
            }

            function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
                var shift = getShiftFromSize(size);
                name = readLatin1String(name);
                registerType(rawType, {
                    name: name, "fromWireType": function (wt) {
                        return !!wt
                    }, "toWireType": function (destructors, o) {
                        return o ? trueValue : falseValue
                    }, "argPackAdvance": 8, "readValueFromPointer": function (pointer) {
                        var heap;
                        if (size === 1) {
                            heap = HEAP8
                        } else if (size === 2) {
                            heap = HEAP16
                        } else if (size === 4) {
                            heap = HEAP32
                        } else {
                            throw new TypeError("Unknown boolean type size: " + name)
                        }
                        return this["fromWireType"](heap[pointer >> shift])
                    }, destructorFunction: null
                })
            }

            function ClassHandle_isAliasOf(other) {
                if (!(this instanceof ClassHandle)) {
                    return false
                }
                if (!(other instanceof ClassHandle)) {
                    return false
                }
                var leftClass = this.$$.ptrType.registeredClass;
                var left = this.$$.ptr;
                var rightClass = other.$$.ptrType.registeredClass;
                var right = other.$$.ptr;
                while (leftClass.baseClass) {
                    left = leftClass.upcast(left);
                    leftClass = leftClass.baseClass
                }
                while (rightClass.baseClass) {
                    right = rightClass.upcast(right);
                    rightClass = rightClass.baseClass
                }
                return leftClass === rightClass && left === right
            }

            function shallowCopyInternalPointer(o) {
                return {
                    count: o.count,
                    deleteScheduled: o.deleteScheduled,
                    preservePointerOnDelete: o.preservePointerOnDelete,
                    ptr: o.ptr,
                    ptrType: o.ptrType,
                    smartPtr: o.smartPtr,
                    smartPtrType: o.smartPtrType
                }
            }

            function throwInstanceAlreadyDeleted(obj) {
                function getInstanceTypeName(handle) {
                    return handle.$$.ptrType.registeredClass.name
                }

                throwBindingError(getInstanceTypeName(obj) + " instance already deleted")
            }

            var finalizationGroup = false;

            function detachFinalizer(handle) {
            }

            function runDestructor($$) {
                if ($$.smartPtr) {
                    $$.smartPtrType.rawDestructor($$.smartPtr)
                } else {
                    $$.ptrType.registeredClass.rawDestructor($$.ptr)
                }
            }

            function releaseClassHandle($$) {
                $$.count.value -= 1;
                var toDelete = 0 === $$.count.value;
                if (toDelete) {
                    runDestructor($$)
                }
            }

            function attachFinalizer(handle) {
                if ("undefined" === typeof FinalizationGroup) {
                    attachFinalizer = function (handle) {
                        return handle
                    };
                    return handle
                }
                finalizationGroup = new FinalizationGroup(function (iter) {
                    for (var result = iter.next(); !result.done; result = iter.next()) {
                        var $$ = result.value;
                        if (!$$.ptr) {

                        } else {
                            releaseClassHandle($$)
                        }
                    }
                });
                attachFinalizer = function (handle) {
                    finalizationGroup.register(handle, handle.$$, handle.$$);
                    return handle
                };
                detachFinalizer = function (handle) {
                    finalizationGroup.unregister(handle.$$)
                };
                return attachFinalizer(handle)
            }

            function ClassHandle_clone() {
                if (!this.$$.ptr) {
                    throwInstanceAlreadyDeleted(this)
                }
                if (this.$$.preservePointerOnDelete) {
                    this.$$.count.value += 1;
                    return this
                } else {
                    var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {$$: {value: shallowCopyInternalPointer(this.$$)}}));
                    clone.$$.count.value += 1;
                    clone.$$.deleteScheduled = false;
                    return clone
                }
            }

            function ClassHandle_delete() {
                if (!this.$$.ptr) {
                    throwInstanceAlreadyDeleted(this)
                }
                if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
                    throwBindingError("Object already scheduled for deletion")
                }
                detachFinalizer(this);
                releaseClassHandle(this.$$);
                if (!this.$$.preservePointerOnDelete) {
                    this.$$.smartPtr = undefined;
                    this.$$.ptr = undefined
                }
            }

            function ClassHandle_isDeleted() {
                return !this.$$.ptr
            }

            var delayFunction = undefined;
            var deletionQueue = [];

            function flushPendingDeletes() {
                while (deletionQueue.length) {
                    var obj = deletionQueue.pop();
                    obj.$$.deleteScheduled = false;
                    obj["delete"]()
                }
            }

            function ClassHandle_deleteLater() {
                if (!this.$$.ptr) {
                    throwInstanceAlreadyDeleted(this)
                }
                if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
                    throwBindingError("Object already scheduled for deletion")
                }
                deletionQueue.push(this);
                if (deletionQueue.length === 1 && delayFunction) {
                    delayFunction(flushPendingDeletes)
                }
                this.$$.deleteScheduled = true;
                return this
            }

            function init_ClassHandle() {
                ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
                ClassHandle.prototype["clone"] = ClassHandle_clone;
                ClassHandle.prototype["delete"] = ClassHandle_delete;
                ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
                ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater
            }

            function ClassHandle() {
            }

            var registeredPointers = {};

            function ensureOverloadTable(proto, methodName, humanName) {
                if (undefined === proto[methodName].overloadTable) {
                    var prevFunc = proto[methodName];
                    proto[methodName] = function () {
                        if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                            throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!")
                        }
                        return proto[methodName].overloadTable[arguments.length].apply(this, arguments)
                    };
                    proto[methodName].overloadTable = [];
                    proto[methodName].overloadTable[prevFunc.argCount] = prevFunc
                }
            }

            function exposePublicSymbol(name, value, numArguments) {
                if (Module.hasOwnProperty(name)) {
                    if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
                        throwBindingError("Cannot register public name '" + name + "' twice")
                    }
                    ensureOverloadTable(Module, name, name);
                    if (Module.hasOwnProperty(numArguments)) {
                        throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!")
                    }
                    Module[name].overloadTable[numArguments] = value
                } else {
                    Module[name] = value;
                    if (undefined !== numArguments) {
                        Module[name].numArguments = numArguments
                    }
                }
            }

            function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
                this.name = name;
                this.constructor = constructor;
                this.instancePrototype = instancePrototype;
                this.rawDestructor = rawDestructor;
                this.baseClass = baseClass;
                this.getActualType = getActualType;
                this.upcast = upcast;
                this.downcast = downcast;
                this.pureVirtualFunctions = []
            }

            function upcastPointer(ptr, ptrClass, desiredClass) {
                while (ptrClass !== desiredClass) {
                    if (!ptrClass.upcast) {
                        throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name)
                    }
                    ptr = ptrClass.upcast(ptr);
                    ptrClass = ptrClass.baseClass
                }
                return ptr
            }

            function constNoSmartPtrRawPointerToWireType(destructors, handle) {
                if (handle === null) {
                    if (this.isReference) {
                        throwBindingError("null is not a valid " + this.name)
                    }
                    return 0
                }
                if (!handle.$$) {
                    throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
                }
                if (!handle.$$.ptr) {
                    throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
                }
                var handleClass = handle.$$.ptrType.registeredClass;
                var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
                return ptr
            }

            function genericPointerToWireType(destructors, handle) {
                var ptr;
                if (handle === null) {
                    if (this.isReference) {
                        throwBindingError("null is not a valid " + this.name)
                    }
                    if (this.isSmartPointer) {
                        ptr = this.rawConstructor();
                        if (destructors !== null) {
                            destructors.push(this.rawDestructor, ptr)
                        }
                        return ptr
                    } else {
                        return 0
                    }
                }
                if (!handle.$$) {
                    throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
                }
                if (!handle.$$.ptr) {
                    throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
                }
                if (!this.isConst && handle.$$.ptrType.isConst) {
                    throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name)
                }
                var handleClass = handle.$$.ptrType.registeredClass;
                ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
                if (this.isSmartPointer) {
                    if (undefined === handle.$$.smartPtr) {
                        throwBindingError("Passing raw pointer to smart pointer is illegal")
                    }
                    switch (this.sharingPolicy) {
                        case 0:
                            if (handle.$$.smartPtrType === this) {
                                ptr = handle.$$.smartPtr
                            } else {
                                throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name)
                            }
                            break;
                        case 1:
                            ptr = handle.$$.smartPtr;
                            break;
                        case 2:
                            if (handle.$$.smartPtrType === this) {
                                ptr = handle.$$.smartPtr
                            } else {
                                var clonedHandle = handle["clone"]();
                                ptr = this.rawShare(ptr, __emval_register(function () {
                                    clonedHandle["delete"]()
                                }));
                                if (destructors !== null) {
                                    destructors.push(this.rawDestructor, ptr)
                                }
                            }
                            break;
                        default:
                            throwBindingError("Unsupporting sharing policy")
                    }
                }
                return ptr
            }

            function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
                if (handle === null) {
                    if (this.isReference) {
                        throwBindingError("null is not a valid " + this.name)
                    }
                    return 0
                }
                if (!handle.$$) {
                    throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
                }
                if (!handle.$$.ptr) {
                    throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
                }
                if (handle.$$.ptrType.isConst) {
                    throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name)
                }
                var handleClass = handle.$$.ptrType.registeredClass;
                var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
                return ptr
            }

            function RegisteredPointer_getPointee(ptr) {
                if (this.rawGetPointee) {
                    ptr = this.rawGetPointee(ptr)
                }
                return ptr
            }

            function RegisteredPointer_destructor(ptr) {
                if (this.rawDestructor) {
                    this.rawDestructor(ptr)
                }
            }

            function RegisteredPointer_deleteObject(handle) {
                if (handle !== null) {
                    handle["delete"]()
                }
            }

            function downcastPointer(ptr, ptrClass, desiredClass) {
                if (ptrClass === desiredClass) {
                    return ptr
                }
                if (undefined === desiredClass.baseClass) {
                    return null
                }
                var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
                if (rv === null) {
                    return null
                }
                return desiredClass.downcast(rv)
            }

            function getInheritedInstanceCount() {
                return Object.keys(registeredInstances).length
            }

            function getLiveInheritedInstances() {
                var rv = [];
                for (var k in registeredInstances) {
                    if (registeredInstances.hasOwnProperty(k)) {
                        rv.push(registeredInstances[k])
                    }
                }
                return rv
            }

            function setDelayFunction(fn) {
                delayFunction = fn;
                if (deletionQueue.length && delayFunction) {
                    delayFunction(flushPendingDeletes)
                }
            }

            function init_embind() {
                Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
                Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
                Module["flushPendingDeletes"] = flushPendingDeletes;
                Module["setDelayFunction"] = setDelayFunction
            }

            var registeredInstances = {};

            function getBasestPointer(class_, ptr) {
                if (ptr === undefined) {
                    throwBindingError("ptr should not be undefined")
                }
                while (class_.baseClass) {
                    ptr = class_.upcast(ptr);
                    class_ = class_.baseClass
                }
                return ptr
            }

            function getInheritedInstance(class_, ptr) {
                ptr = getBasestPointer(class_, ptr);
                return registeredInstances[ptr]
            }

            function makeClassHandle(prototype, record) {
                if (!record.ptrType || !record.ptr) {
                    throwInternalError("makeClassHandle requires ptr and ptrType")
                }
                var hasSmartPtrType = !!record.smartPtrType;
                var hasSmartPtr = !!record.smartPtr;
                if (hasSmartPtrType !== hasSmartPtr) {
                    throwInternalError("Both smartPtrType and smartPtr must be specified")
                }
                record.count = {value: 1};
                return attachFinalizer(Object.create(prototype, {$$: {value: record}}))
            }

            function RegisteredPointer_fromWireType(ptr) {
                var rawPointer = this.getPointee(ptr);
                if (!rawPointer) {
                    this.destructor(ptr);
                    return null
                }
                var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
                if (undefined !== registeredInstance) {
                    if (0 === registeredInstance.$$.count.value) {
                        registeredInstance.$$.ptr = rawPointer;
                        registeredInstance.$$.smartPtr = ptr;
                        return registeredInstance["clone"]()
                    } else {
                        var rv = registeredInstance["clone"]();
                        this.destructor(ptr);
                        return rv
                    }
                }

                function makeDefaultHandle() {
                    if (this.isSmartPointer) {
                        return makeClassHandle(this.registeredClass.instancePrototype, {
                            ptrType: this.pointeeType,
                            ptr: rawPointer,
                            smartPtrType: this,
                            smartPtr: ptr
                        })
                    } else {
                        return makeClassHandle(this.registeredClass.instancePrototype, {ptrType: this, ptr: ptr})
                    }
                }

                var actualType = this.registeredClass.getActualType(rawPointer);
                var registeredPointerRecord = registeredPointers[actualType];
                if (!registeredPointerRecord) {
                    return makeDefaultHandle.call(this)
                }
                var toType;
                if (this.isConst) {
                    toType = registeredPointerRecord.constPointerType
                } else {
                    toType = registeredPointerRecord.pointerType
                }
                var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
                if (dp === null) {
                    return makeDefaultHandle.call(this)
                }
                if (this.isSmartPointer) {
                    return makeClassHandle(toType.registeredClass.instancePrototype, {
                        ptrType: toType,
                        ptr: dp,
                        smartPtrType: this,
                        smartPtr: ptr
                    })
                } else {
                    return makeClassHandle(toType.registeredClass.instancePrototype, {ptrType: toType, ptr: dp})
                }
            }

            function init_RegisteredPointer() {
                RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
                RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
                RegisteredPointer.prototype["argPackAdvance"] = 8;
                RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
                RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
                RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType
            }

            function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
                this.name = name;
                this.registeredClass = registeredClass;
                this.isReference = isReference;
                this.isConst = isConst;
                this.isSmartPointer = isSmartPointer;
                this.pointeeType = pointeeType;
                this.sharingPolicy = sharingPolicy;
                this.rawGetPointee = rawGetPointee;
                this.rawConstructor = rawConstructor;
                this.rawShare = rawShare;
                this.rawDestructor = rawDestructor;
                if (!isSmartPointer && registeredClass.baseClass === undefined) {
                    if (isConst) {
                        this["toWireType"] = constNoSmartPtrRawPointerToWireType;
                        this.destructorFunction = null
                    } else {
                        this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
                        this.destructorFunction = null
                    }
                } else {
                    this["toWireType"] = genericPointerToWireType
                }
            }

            function replacePublicSymbol(name, value, numArguments) {
                if (!Module.hasOwnProperty(name)) {
                    throwInternalError("Replacing nonexistant public symbol")
                }
                if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
                    Module[name].overloadTable[numArguments] = value
                } else {
                    Module[name] = value;
                    Module[name].argCount = numArguments
                }
            }

            function dynCallLegacy(sig, ptr, args) {
                var f = Module["dynCall_" + sig];
                return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr)
            }

            function dynCall(sig, ptr, args) {
                if (sig.indexOf("j") != -1) {
                    return dynCallLegacy(sig, ptr, args)
                }
                return wasmTable.get(ptr).apply(null, args)
            }

            function getDynCaller(sig, ptr) {
                var argCache = [];
                return function () {
                    argCache.length = arguments.length;
                    for (var i = 0; i < arguments.length; i++) {
                        argCache[i] = arguments[i]
                    }
                    return dynCall(sig, ptr, argCache)
                }
            }

            function embind__requireFunction(signature, rawFunction) {
                signature = readLatin1String(signature);

                function makeDynCaller() {
                    if (signature.indexOf("j") != -1) {
                        return getDynCaller(signature, rawFunction)
                    }
                    return wasmTable.get(rawFunction)
                }

                var fp = makeDynCaller();
                if (typeof fp !== "function") {
                    throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction)
                }
                return fp
            }

            var UnboundTypeError = undefined;

            function getTypeName(type) {
                var ptr = ___getTypeName(type);
                var rv = readLatin1String(ptr);
                _free(ptr);
                return rv
            }

            function throwUnboundTypeError(message, types) {
                var unboundTypes = [];
                var seen = {};

                function visit(type) {
                    if (seen[type]) {
                        return
                    }
                    if (registeredTypes[type]) {
                        return
                    }
                    if (typeDependencies[type]) {
                        typeDependencies[type].forEach(visit);
                        return
                    }
                    unboundTypes.push(type);
                    seen[type] = true
                }

                types.forEach(visit);
                throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([", "]))
            }

            function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
                name = readLatin1String(name);
                getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
                if (upcast) {
                    upcast = embind__requireFunction(upcastSignature, upcast)
                }
                if (downcast) {
                    downcast = embind__requireFunction(downcastSignature, downcast)
                }
                rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
                var legalFunctionName = makeLegalFunctionName(name);
                exposePublicSymbol(legalFunctionName, function () {
                    throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [baseClassRawType])
                });
                whenDependentTypesAreResolved([rawType, rawPointerType, rawConstPointerType], baseClassRawType ? [baseClassRawType] : [], function (base) {
                    base = base[0];
                    var baseClass;
                    var basePrototype;
                    if (baseClassRawType) {
                        baseClass = base.registeredClass;
                        basePrototype = baseClass.instancePrototype
                    } else {
                        basePrototype = ClassHandle.prototype
                    }
                    var constructor = createNamedFunction(legalFunctionName, function () {
                        if (Object.getPrototypeOf(this) !== instancePrototype) {
                            throw new BindingError("Use 'new' to construct " + name)
                        }
                        if (undefined === registeredClass.constructor_body) {
                            throw new BindingError(name + " has no accessible constructor")
                        }
                        var body = registeredClass.constructor_body[arguments.length];
                        if (undefined === body) {
                            throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!")
                        }
                        return body.apply(this, arguments)
                    });
                    var instancePrototype = Object.create(basePrototype, {constructor: {value: constructor}});
                    constructor.prototype = instancePrototype;
                    var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
                    var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
                    var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
                    var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
                    registeredPointers[rawType] = {
                        pointerType: pointerConverter,
                        constPointerType: constPointerConverter
                    };
                    replacePublicSymbol(legalFunctionName, constructor);
                    return [referenceConverter, pointerConverter, constPointerConverter]
                })
            }

            function new_(constructor, argumentList) {
                if (!(constructor instanceof Function)) {
                    throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function")
                }
                var dummy = createNamedFunction(constructor.name || "unknownFunctionName", function () {
                });
                dummy.prototype = constructor.prototype;
                var obj = new dummy;
                var r = constructor.apply(obj, argumentList);
                return r instanceof Object ? r : obj
            }

            function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
                var argCount = argTypes.length;
                if (argCount < 2) {
                    throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!")
                }
                var isClassMethodFunc = argTypes[1] !== null && classType !== null;
                var needsDestructorStack = false;
                for (var i = 1; i < argTypes.length; ++i) {
                    if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
                        needsDestructorStack = true;
                        break
                    }
                }
                var returns = argTypes[0].name !== "void";
                var argsList = "";
                var argsListWired = "";
                for (var i = 0; i < argCount - 2; ++i) {
                    argsList += (i !== 0 ? ", " : "") + "arg" + i;
                    argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired"
                }
                var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
                if (needsDestructorStack) {
                    invokerFnBody += "var destructors = [];\n"
                }
                var dtorStack = needsDestructorStack ? "destructors" : "null";
                var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
                var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
                if (isClassMethodFunc) {
                    invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n"
                }
                for (var i = 0; i < argCount - 2; ++i) {
                    invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
                    args1.push("argType" + i);
                    args2.push(argTypes[i + 2])
                }
                if (isClassMethodFunc) {
                    argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired
                }
                invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
                if (needsDestructorStack) {
                    invokerFnBody += "runDestructors(destructors);\n"
                } else {
                    for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
                        var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
                        if (argTypes[i].destructorFunction !== null) {
                            invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
                            args1.push(paramName + "_dtor");
                            args2.push(argTypes[i].destructorFunction)
                        }
                    }
                }
                if (returns) {
                    invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n"
                } else {
                }
                invokerFnBody += "}\n";
                args1.push(invokerFnBody);
                var invokerFunction = new_(Function, args1).apply(null, args2);
                return invokerFunction
            }

            function heap32VectorToArray(count, firstElement) {
                var array = [];
                for (var i = 0; i < count; i++) {
                    array.push(HEAP32[(firstElement >> 2) + i])
                }
                return array
            }

            function __embind_register_class_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, fn) {
                var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
                methodName = readLatin1String(methodName);
                rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
                whenDependentTypesAreResolved([], [rawClassType], function (classType) {
                    classType = classType[0];
                    var humanName = classType.name + "." + methodName;

                    function unboundTypesHandler() {
                        throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes)
                    }

                    var proto = classType.registeredClass.constructor;
                    if (undefined === proto[methodName]) {
                        unboundTypesHandler.argCount = argCount - 1;
                        proto[methodName] = unboundTypesHandler
                    } else {
                        ensureOverloadTable(proto, methodName, humanName);
                        proto[methodName].overloadTable[argCount - 1] = unboundTypesHandler
                    }
                    whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
                        var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
                        var func = craftInvokerFunction(humanName, invokerArgsArray, null, rawInvoker, fn);
                        if (undefined === proto[methodName].overloadTable) {
                            func.argCount = argCount - 1;
                            proto[methodName] = func
                        } else {
                            proto[methodName].overloadTable[argCount - 1] = func
                        }
                        return []
                    });
                    return []
                })
            }

            function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
                assert(argCount > 0);
                var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
                invoker = embind__requireFunction(invokerSignature, invoker);
                var args = [rawConstructor];
                var destructors = [];
                whenDependentTypesAreResolved([], [rawClassType], function (classType) {
                    classType = classType[0];
                    var humanName = "constructor " + classType.name;
                    if (undefined === classType.registeredClass.constructor_body) {
                        classType.registeredClass.constructor_body = []
                    }
                    if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
                        throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!")
                    }
                    classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
                        throwUnboundTypeError("Cannot construct " + classType.name + " due to unbound types", rawArgTypes)
                    };
                    whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
                        classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
                            if (arguments.length !== argCount - 1) {
                                throwBindingError(humanName + " called with " + arguments.length + " arguments, expected " + (argCount - 1))
                            }
                            destructors.length = 0;
                            args.length = argCount;
                            for (var i = 1; i < argCount; ++i) {
                                args[i] = argTypes[i]["toWireType"](destructors, arguments[i - 1])
                            }
                            var ptr = invoker.apply(null, args);
                            runDestructors(destructors);
                            return argTypes[0]["fromWireType"](ptr)
                        };
                        return []
                    });
                    return []
                })
            }

            function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual) {
                var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
                methodName = readLatin1String(methodName);
                rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
                whenDependentTypesAreResolved([], [rawClassType], function (classType) {
                    classType = classType[0];
                    var humanName = classType.name + "." + methodName;
                    if (isPureVirtual) {
                        classType.registeredClass.pureVirtualFunctions.push(methodName)
                    }

                    function unboundTypesHandler() {
                        throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes)
                    }

                    var proto = classType.registeredClass.instancePrototype;
                    var method = proto[methodName];
                    if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
                        unboundTypesHandler.argCount = argCount - 2;
                        unboundTypesHandler.className = classType.name;
                        proto[methodName] = unboundTypesHandler
                    } else {
                        ensureOverloadTable(proto, methodName, humanName);
                        proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler
                    }
                    whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
                        var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
                        if (undefined === proto[methodName].overloadTable) {
                            memberFunction.argCount = argCount - 2;
                            proto[methodName] = memberFunction
                        } else {
                            proto[methodName].overloadTable[argCount - 2] = memberFunction
                        }
                        return []
                    });
                    return []
                })
            }

            function validateThis(this_, classType, humanName) {
                if (!(this_ instanceof Object)) {
                    throwBindingError(humanName + ' with invalid "this": ' + this_)
                }
                if (!(this_ instanceof classType.registeredClass.constructor)) {
                    throwBindingError(humanName + ' incompatible with "this" of type ' + this_.constructor.name)
                }
                if (!this_.$$.ptr) {
                    throwBindingError("cannot call emscripten binding method " + humanName + " on deleted object")
                }
                return upcastPointer(this_.$$.ptr, this_.$$.ptrType.registeredClass, classType.registeredClass)
            }

            function __embind_register_class_property(classType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
                fieldName = readLatin1String(fieldName);
                getter = embind__requireFunction(getterSignature, getter);
                whenDependentTypesAreResolved([], [classType], function (classType) {
                    classType = classType[0];
                    var humanName = classType.name + "." + fieldName;
                    var desc = {
                        get: function () {
                            throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [getterReturnType, setterArgumentType])
                        }, enumerable: true, configurable: true
                    };
                    if (setter) {
                        desc.set = function () {
                            throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [getterReturnType, setterArgumentType])
                        }
                    } else {
                        desc.set = function (v) {
                            throwBindingError(humanName + " is a read-only property")
                        }
                    }
                    Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
                    whenDependentTypesAreResolved([], setter ? [getterReturnType, setterArgumentType] : [getterReturnType], function (types) {
                        var getterReturnType = types[0];
                        var desc = {
                            get: function () {
                                var ptr = validateThis(this, classType, humanName + " getter");
                                return getterReturnType["fromWireType"](getter(getterContext, ptr))
                            }, enumerable: true
                        };
                        if (setter) {
                            setter = embind__requireFunction(setterSignature, setter);
                            var setterArgumentType = types[1];
                            desc.set = function (v) {
                                var ptr = validateThis(this, classType, humanName + " setter");
                                var destructors = [];
                                setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, v));
                                runDestructors(destructors)
                            }
                        }
                        Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
                        return []
                    });
                    return []
                })
            }

            var emval_free_list = [];
            var emval_handle_array = [{}, {value: undefined}, {value: null}, {value: true}, {value: false}];

            function __emval_decref(handle) {
                if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
                    emval_handle_array[handle] = undefined;
                    emval_free_list.push(handle)
                }
            }

            function count_emval_handles() {
                var count = 0;
                for (var i = 5; i < emval_handle_array.length; ++i) {
                    if (emval_handle_array[i] !== undefined) {
                        ++count
                    }
                }
                return count
            }

            function get_first_emval() {
                for (var i = 5; i < emval_handle_array.length; ++i) {
                    if (emval_handle_array[i] !== undefined) {
                        return emval_handle_array[i]
                    }
                }
                return null
            }

            function init_emval() {
                Module["count_emval_handles"] = count_emval_handles;
                Module["get_first_emval"] = get_first_emval
            }

            function __emval_register(value) {
                switch (value) {
                    case undefined: {
                        return 1
                    }
                    case null: {
                        return 2
                    }
                    case true: {
                        return 3
                    }
                    case false: {
                        return 4
                    }
                    default: {
                        var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
                        emval_handle_array[handle] = {refcount: 1, value: value};
                        return handle
                    }
                }
            }

            function __embind_register_emval(rawType, name) {
                name = readLatin1String(name);
                registerType(rawType, {
                    name: name, "fromWireType": function (handle) {
                        var rv = emval_handle_array[handle].value;
                        __emval_decref(handle);
                        return rv
                    }, "toWireType": function (destructors, value) {
                        return __emval_register(value)
                    }, "argPackAdvance": 8, "readValueFromPointer": simpleReadValueFromPointer, destructorFunction: null
                })
            }

            function _embind_repr(v) {
                if (v === null) {
                    return "null"
                }
                var t = typeof v;
                if (t === "object" || t === "array" || t === "function") {
                    return v.toString()
                } else {
                    return "" + v
                }
            }

            function floatReadValueFromPointer(name, shift) {
                switch (shift) {
                    case 2:
                        return function (pointer) {
                            return this["fromWireType"](HEAPF32[pointer >> 2])
                        };
                    case 3:
                        return function (pointer) {
                            return this["fromWireType"](HEAPF64[pointer >> 3])
                        };
                    default:
                        throw new TypeError("Unknown float type: " + name)
                }
            }

            function __embind_register_float(rawType, name, size) {
                var shift = getShiftFromSize(size);
                name = readLatin1String(name);
                registerType(rawType, {
                    name: name,
                    "fromWireType": function (value) {
                        return value
                    },
                    "toWireType": function (destructors, value) {
                        if (typeof value !== "number" && typeof value !== "boolean") {
                            throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
                        }
                        return value
                    },
                    "argPackAdvance": 8,
                    "readValueFromPointer": floatReadValueFromPointer(name, shift),
                    destructorFunction: null
                })
            }

            function integerReadValueFromPointer(name, shift, signed) {
                switch (shift) {
                    case 0:
                        return signed ? function readS8FromPointer(pointer) {
                            return HEAP8[pointer]
                        } : function readU8FromPointer(pointer) {
                            return HEAPU8[pointer]
                        };
                    case 1:
                        return signed ? function readS16FromPointer(pointer) {
                            return HEAP16[pointer >> 1]
                        } : function readU16FromPointer(pointer) {
                            return HEAPU16[pointer >> 1]
                        };
                    case 2:
                        return signed ? function readS32FromPointer(pointer) {
                            return HEAP32[pointer >> 2]
                        } : function readU32FromPointer(pointer) {
                            return HEAPU32[pointer >> 2]
                        };
                    default:
                        throw new TypeError("Unknown integer type: " + name)
                }
            }

            function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
                name = readLatin1String(name);
                if (maxRange === -1) {
                    maxRange = 4294967295
                }
                var shift = getShiftFromSize(size);
                var fromWireType = function (value) {
                    return value
                };
                if (minRange === 0) {
                    var bitshift = 32 - 8 * size;
                    fromWireType = function (value) {
                        return value << bitshift >>> bitshift
                    }
                }
                var isUnsignedType = name.indexOf("unsigned") != -1;
                registerType(primitiveType, {
                    name: name,
                    "fromWireType": fromWireType,
                    "toWireType": function (destructors, value) {
                        if (typeof value !== "number" && typeof value !== "boolean") {
                            throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
                        }
                        if (value < minRange || value > maxRange) {
                            throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!")
                        }
                        return isUnsignedType ? value >>> 0 : value | 0
                    },
                    "argPackAdvance": 8,
                    "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
                    destructorFunction: null
                })
            }

            function __embind_register_memory_view(rawType, dataTypeIndex, name) {
                var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
                var TA = typeMapping[dataTypeIndex];

                function decodeMemoryView(handle) {
                    handle = handle >> 2;
                    var heap = HEAPU32;
                    var size = heap[handle];
                    var data = heap[handle + 1];
                    return new TA(buffer, data, size)
                }

                name = readLatin1String(name);
                registerType(rawType, {
                    name: name,
                    "fromWireType": decodeMemoryView,
                    "argPackAdvance": 8,
                    "readValueFromPointer": decodeMemoryView
                }, {ignoreDuplicateRegistrations: true})
            }

            function __embind_register_std_string(rawType, name) {
                name = readLatin1String(name);
                var stdStringIsUTF8 = name === "std::string";
                registerType(rawType, {
                    name: name,
                    "fromWireType": function (value) {
                        var length = HEAPU32[value >> 2];
                        var str;
                        if (stdStringIsUTF8) {
                            var decodeStartPtr = value + 4;
                            for (var i = 0; i <= length; ++i) {
                                var currentBytePtr = value + 4 + i;
                                if (i == length || HEAPU8[currentBytePtr] == 0) {
                                    var maxRead = currentBytePtr - decodeStartPtr;
                                    var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
                                    if (str === undefined) {
                                        str = stringSegment
                                    } else {
                                        str += String.fromCharCode(0);
                                        str += stringSegment
                                    }
                                    decodeStartPtr = currentBytePtr + 1
                                }
                            }
                        } else {
                            var a = new Array(length);
                            for (var i = 0; i < length; ++i) {
                                a[i] = String.fromCharCode(HEAPU8[value + 4 + i])
                            }
                            str = a.join("")
                        }
                        _free(value);
                        return str
                    },
                    "toWireType": function (destructors, value) {
                        if (value instanceof ArrayBuffer) {
                            value = new Uint8Array(value)
                        }
                        var getLength;
                        var valueIsOfTypeString = typeof value === "string";
                        if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                            throwBindingError("Cannot pass non-string to std::string")
                        }
                        if (stdStringIsUTF8 && valueIsOfTypeString) {
                            getLength = function () {
                                return lengthBytesUTF8(value)
                            }
                        } else {
                            getLength = function () {
                                return value.length
                            }
                        }
                        var length = getLength();
                        var ptr = _malloc(4 + length + 1);
                        HEAPU32[ptr >> 2] = length;
                        if (stdStringIsUTF8 && valueIsOfTypeString) {
                            stringToUTF8(value, ptr + 4, length + 1)
                        } else {
                            if (valueIsOfTypeString) {
                                for (var i = 0; i < length; ++i) {
                                    var charCode = value.charCodeAt(i);
                                    if (charCode > 255) {
                                        _free(ptr);
                                        throwBindingError("String has UTF-16 code units that do not fit in 8 bits")
                                    }
                                    HEAPU8[ptr + 4 + i] = charCode
                                }
                            } else {
                                for (var i = 0; i < length; ++i) {
                                    HEAPU8[ptr + 4 + i] = value[i]
                                }
                            }
                        }
                        if (destructors !== null) {
                            destructors.push(_free, ptr)
                        }
                        return ptr
                    },
                    "argPackAdvance": 8,
                    "readValueFromPointer": simpleReadValueFromPointer,
                    destructorFunction: function (ptr) {
                        _free(ptr)
                    }
                })
            }

            function __embind_register_std_wstring(rawType, charSize, name) {
                name = readLatin1String(name);
                var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
                if (charSize === 2) {
                    decodeString = UTF16ToString;
                    encodeString = stringToUTF16;
                    lengthBytesUTF = lengthBytesUTF16;
                    getHeap = function () {
                        return HEAPU16
                    };
                    shift = 1
                } else if (charSize === 4) {
                    decodeString = UTF32ToString;
                    encodeString = stringToUTF32;
                    lengthBytesUTF = lengthBytesUTF32;
                    getHeap = function () {
                        return HEAPU32
                    };
                    shift = 2
                }
                registerType(rawType, {
                    name: name,
                    "fromWireType": function (value) {
                        var length = HEAPU32[value >> 2];
                        var HEAP = getHeap();
                        var str;
                        var decodeStartPtr = value + 4;
                        for (var i = 0; i <= length; ++i) {
                            var currentBytePtr = value + 4 + i * charSize;
                            if (i == length || HEAP[currentBytePtr >> shift] == 0) {
                                var maxReadBytes = currentBytePtr - decodeStartPtr;
                                var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
                                if (str === undefined) {
                                    str = stringSegment
                                } else {
                                    str += String.fromCharCode(0);
                                    str += stringSegment
                                }
                                decodeStartPtr = currentBytePtr + charSize
                            }
                        }
                        _free(value);
                        return str
                    },
                    "toWireType": function (destructors, value) {
                        if (!(typeof value === "string")) {
                            throwBindingError("Cannot pass non-string to C++ string type " + name)
                        }
                        var length = lengthBytesUTF(value);
                        var ptr = _malloc(4 + length + charSize);
                        HEAPU32[ptr >> 2] = length >> shift;
                        encodeString(value, ptr + 4, length + charSize);
                        if (destructors !== null) {
                            destructors.push(_free, ptr)
                        }
                        return ptr
                    },
                    "argPackAdvance": 8,
                    "readValueFromPointer": simpleReadValueFromPointer,
                    destructorFunction: function (ptr) {
                        _free(ptr)
                    }
                })
            }

            function __embind_register_value_object(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
                structRegistrations[rawType] = {
                    name: readLatin1String(name),
                    rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
                    rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
                    fields: []
                }
            }

            function __embind_register_value_object_field(structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
                structRegistrations[structType].fields.push({
                    fieldName: readLatin1String(fieldName),
                    getterReturnType: getterReturnType,
                    getter: embind__requireFunction(getterSignature, getter),
                    getterContext: getterContext,
                    setterArgumentType: setterArgumentType,
                    setter: embind__requireFunction(setterSignature, setter),
                    setterContext: setterContext
                })
            }

            function __embind_register_void(rawType, name) {
                name = readLatin1String(name);
                registerType(rawType, {
                    isVoid: true, name: name, "argPackAdvance": 0, "fromWireType": function () {
                        return undefined
                    }, "toWireType": function (destructors, o) {
                        return undefined
                    }
                })
            }

            function requireHandle(handle) {
                if (!handle) {
                    throwBindingError("Cannot use deleted val. handle = " + handle)
                }
                return emval_handle_array[handle].value
            }

            function requireRegisteredType(rawType, humanName) {
                var impl = registeredTypes[rawType];
                if (undefined === impl) {
                    throwBindingError(humanName + " has unknown type " + getTypeName(rawType))
                }
                return impl
            }

            function __emval_as(handle, returnType, destructorsRef) {
                handle = requireHandle(handle);
                returnType = requireRegisteredType(returnType, "emval::as");
                var destructors = [];
                var rd = __emval_register(destructors);
                HEAP32[destructorsRef >> 2] = rd;
                return returnType["toWireType"](destructors, handle)
            }

            function __emval_allocateDestructors(destructorsRef) {
                var destructors = [];
                HEAP32[destructorsRef >> 2] = __emval_register(destructors);
                return destructors
            }

            var emval_symbols = {};

            function getStringOrSymbol(address) {
                var symbol = emval_symbols[address];
                if (symbol === undefined) {
                    return readLatin1String(address)
                } else {
                    return symbol
                }
            }

            var emval_methodCallers = [];

            function __emval_call_method(caller, handle, methodName, destructorsRef, args) {
                caller = emval_methodCallers[caller];
                handle = requireHandle(handle);
                methodName = getStringOrSymbol(methodName);
                return caller(handle, methodName, __emval_allocateDestructors(destructorsRef), args)
            }

            function __emval_call_void_method(caller, handle, methodName, args) {
                caller = emval_methodCallers[caller];
                handle = requireHandle(handle);
                methodName = getStringOrSymbol(methodName);
                caller(handle, methodName, null, args)
            }

            function emval_get_global() {
                if (typeof globalThis === "object") {
                    return globalThis
                }
                return function () {
                    return Function
                }()("return this")()
            }

            function __emval_get_global(name) {
                if (name === 0) {
                    return __emval_register(emval_get_global())
                } else {
                    name = getStringOrSymbol(name);
                    return __emval_register(emval_get_global()[name])
                }
            }

            function __emval_addMethodCaller(caller) {
                var id = emval_methodCallers.length;
                emval_methodCallers.push(caller);
                return id
            }

            function __emval_lookupTypes(argCount, argTypes) {
                var a = new Array(argCount);
                for (var i = 0; i < argCount; ++i) {
                    a[i] = requireRegisteredType(HEAP32[(argTypes >> 2) + i], "parameter " + i)
                }
                return a
            }

            function __emval_get_method_caller(argCount, argTypes) {
                var types = __emval_lookupTypes(argCount, argTypes);
                var retType = types[0];
                var signatureName = retType.name + "_$" + types.slice(1).map(function (t) {
                    return t.name
                }).join("_") + "$";
                var params = ["retType"];
                var args = [retType];
                var argsList = "";
                for (var i = 0; i < argCount - 1; ++i) {
                    argsList += (i !== 0 ? ", " : "") + "arg" + i;
                    params.push("argType" + i);
                    args.push(types[1 + i])
                }
                var functionName = makeLegalFunctionName("methodCaller_" + signatureName);
                var functionBody = "return function " + functionName + "(handle, name, destructors, args) {\n";
                var offset = 0;
                for (var i = 0; i < argCount - 1; ++i) {
                    functionBody += "    var arg" + i + " = argType" + i + ".readValueFromPointer(args" + (offset ? "+" + offset : "") + ");\n";
                    offset += types[i + 1]["argPackAdvance"]
                }
                functionBody += "    var rv = handle[name](" + argsList + ");\n";
                for (var i = 0; i < argCount - 1; ++i) {
                    if (types[i + 1]["deleteObject"]) {
                        functionBody += "    argType" + i + ".deleteObject(arg" + i + ");\n"
                    }
                }
                if (!retType.isVoid) {
                    functionBody += "    return retType.toWireType(destructors, rv);\n"
                }
                functionBody += "};\n";
                params.push(functionBody);
                var invokerFunction = new_(Function, params).apply(null, args);
                return __emval_addMethodCaller(invokerFunction)
            }

            function __emval_get_property(handle, key) {
                handle = requireHandle(handle);
                key = requireHandle(key);
                return __emval_register(handle[key])
            }

            function __emval_incref(handle) {
                if (handle > 4) {
                    emval_handle_array[handle].refcount += 1
                }
            }

            function craftEmvalAllocator(argCount) {
                var argsList = "";
                for (var i = 0; i < argCount; ++i) {
                    argsList += (i !== 0 ? ", " : "") + "arg" + i
                }
                var functionBody = "return function emval_allocator_" + argCount + "(constructor, argTypes, args) {\n";
                for (var i = 0; i < argCount; ++i) {
                    functionBody += "var argType" + i + " = requireRegisteredType(Module['HEAP32'][(argTypes >>> 2) + " + i + '], "parameter ' + i + '");\n' + "var arg" + i + " = argType" + i + ".readValueFromPointer(args);\n" + "args += argType" + i + "['argPackAdvance'];\n"
                }
                functionBody += "var obj = new constructor(" + argsList + ");\n" + "return __emval_register(obj);\n" + "}\n";
                return new Function("requireRegisteredType", "Module", "__emval_register", functionBody)(requireRegisteredType, Module, __emval_register)
            }

            var emval_newers = {};

            function __emval_new(handle, argCount, argTypes, args) {
                handle = requireHandle(handle);
                var newer = emval_newers[argCount];
                if (!newer) {
                    newer = craftEmvalAllocator(argCount);
                    emval_newers[argCount] = newer
                }
                return newer(handle, argTypes, args)
            }

            function __emval_new_cstring(v) {
                return __emval_register(getStringOrSymbol(v))
            }

            function __emval_run_destructors(handle) {
                var destructors = emval_handle_array[handle].value;
                runDestructors(destructors);
                __emval_decref(handle)
            }

            function __emval_take_value(type, argv) {
                type = requireRegisteredType(type, "_emval_take_value");
                var v = type["readValueFromPointer"](argv);
                return __emval_register(v)
            }

            function _exit(status) {
                exit(status)
            }

            function __exit(a0) {
                return _exit(a0)
            }

            function _abort() {
                abort()
            }

            var _emscripten_get_now;
            _emscripten_get_now = function () {
                return performance.now()
            };
            var _emscripten_get_now_is_monotonic = true;

            function _clock_gettime(clk_id, tp) {
                var now;
                if (clk_id === 0) {
                    now = Date.now()
                } else if ((clk_id === 1 || clk_id === 4) && _emscripten_get_now_is_monotonic) {
                    now = _emscripten_get_now()
                } else {
                    setErrNo(28);
                    return -1
                }
                HEAP32[tp >> 2] = now / 1e3 | 0;
                HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
                return 0
            }

            function _dlopen(filename, flag) {
                abort("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking")
            }

            function _dlsym(handle, symbol) {
                abort("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking")
            }

            function _emscripten_get_heap_max() {
                return 2147483648
            }

            function _emscripten_memcpy_big(dest, src, num) {
                HEAPU8.copyWithin(dest, src, src + num)
            }

            function emscripten_realloc_buffer(size) {
                try {
                    wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
                    updateGlobalBufferAndViews(wasmMemory.buffer);
                    return 1
                } catch (e) {
                }
            }

            function _emscripten_resize_heap(requestedSize) {
                var oldSize = HEAPU8.length;
                var maxHeapSize = 2147483648;
                if (requestedSize > maxHeapSize) {
                    return false
                }
                for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
                    var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
                    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
                    var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
                    var replacement = emscripten_realloc_buffer(newSize);
                    if (replacement) {
                        return true
                    }
                }
                return false
            }

            function _emscripten_thread_sleep(msecs) {
                var start = _emscripten_get_now();
                while (_emscripten_get_now() - start < msecs) {
                }
            }

            var ENV = {};

            function getExecutableName() {
                return thisProgram || "./this.program"
            }

            function getEnvStrings() {
                if (!getEnvStrings.strings) {
                    var lang = (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
                    var env = {
                        "USER": "web_user",
                        "LOGNAME": "web_user",
                        "PATH": "/",
                        "PWD": "/",
                        "HOME": "/home/web_user",
                        "LANG": lang,
                        "_": getExecutableName()
                    };
                    for (var x in ENV) {
                        env[x] = ENV[x]
                    }
                    var strings = [];
                    for (var x in env) {
                        strings.push(x + "=" + env[x])
                    }
                    getEnvStrings.strings = strings
                }
                return getEnvStrings.strings
            }

            function _environ_get(__environ, environ_buf) {
                var bufSize = 0;
                getEnvStrings().forEach(function (string, i) {
                    var ptr = environ_buf + bufSize;
                    HEAP32[__environ + i * 4 >> 2] = ptr;
                    writeAsciiToMemory(string, ptr);
                    bufSize += string.length + 1
                });
                return 0
            }

            function _environ_sizes_get(penviron_count, penviron_buf_size) {
                var strings = getEnvStrings();
                HEAP32[penviron_count >> 2] = strings.length;
                var bufSize = 0;
                strings.forEach(function (string) {
                    bufSize += string.length + 1
                });
                HEAP32[penviron_buf_size >> 2] = bufSize;
                return 0
            }

            function _fd_close(fd) {
                return 0
            }

            function _fd_read(fd, iov, iovcnt, pnum) {
                var stream = SYSCALLS.getStreamFromFD(fd);
                var num = SYSCALLS.doReadv(stream, iov, iovcnt);
                HEAP32[pnum >> 2] = num;
                return 0
            }

            function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
            }

            function _fd_write(fd, iov, iovcnt, pnum) {
                var num = 0;
                for (var i = 0; i < iovcnt; i++) {
                    var ptr = HEAP32[iov + i * 8 >> 2];
                    var len = HEAP32[iov + (i * 8 + 4) >> 2];
                    for (var j = 0; j < len; j++) {
                        SYSCALLS.printChar(fd, HEAPU8[ptr + j])
                    }
                    num += len
                }
                HEAP32[pnum >> 2] = num;
                return 0
            }

            function getRandomDevice() {
                if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
                    var randomBuffer = new Uint8Array(1);
                    return function () {
                        crypto.getRandomValues(randomBuffer);
                        return randomBuffer[0]
                    }
                } else return function () {
                    abort("randomDevice")
                }
            }

            function _getentropy(buffer, size) {
                if (!_getentropy.randomDevice) {
                    _getentropy.randomDevice = getRandomDevice()
                }
                for (var i = 0; i < size; i++) {
                    HEAP8[buffer + i >> 0] = _getentropy.randomDevice()
                }
                return 0
            }

            function _gettimeofday(ptr) {
                var now = Date.now();
                HEAP32[ptr >> 2] = now / 1e3 | 0;
                HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
                return 0
            }

            function _gmtime_r(time, tmPtr) {
                var date = new Date(HEAP32[time >> 2] * 1e3);
                HEAP32[tmPtr >> 2] = date.getUTCSeconds();
                HEAP32[tmPtr + 4 >> 2] = date.getUTCMinutes();
                HEAP32[tmPtr + 8 >> 2] = date.getUTCHours();
                HEAP32[tmPtr + 12 >> 2] = date.getUTCDate();
                HEAP32[tmPtr + 16 >> 2] = date.getUTCMonth();
                HEAP32[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
                HEAP32[tmPtr + 24 >> 2] = date.getUTCDay();
                HEAP32[tmPtr + 36 >> 2] = 0;
                HEAP32[tmPtr + 32 >> 2] = 0;
                var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
                var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
                HEAP32[tmPtr + 28 >> 2] = yday;
                if (!_gmtime_r.GMTString) _gmtime_r.GMTString = allocateUTF8("GMT");
                HEAP32[tmPtr + 40 >> 2] = _gmtime_r.GMTString;
                return tmPtr
            }

            function _tzset() {
                if (_tzset.called) return;
                _tzset.called = true;
                var currentYear = (new Date).getFullYear();
                var winter = new Date(currentYear, 0, 1);
                var summer = new Date(currentYear, 6, 1);
                var winterOffset = winter.getTimezoneOffset();
                var summerOffset = summer.getTimezoneOffset();
                var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
                HEAP32[__get_timezone() >> 2] = stdTimezoneOffset * 60;
                HEAP32[__get_daylight() >> 2] = Number(winterOffset != summerOffset);

                function extractZone(date) {
                    var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
                    return match ? match[1] : "GMT"
                }

                var winterName = extractZone(winter);
                var summerName = extractZone(summer);
                var winterNamePtr = allocateUTF8(winterName);
                var summerNamePtr = allocateUTF8(summerName);
                if (summerOffset < winterOffset) {
                    HEAP32[__get_tzname() >> 2] = winterNamePtr;
                    HEAP32[__get_tzname() + 4 >> 2] = summerNamePtr
                } else {
                    HEAP32[__get_tzname() >> 2] = summerNamePtr;
                    HEAP32[__get_tzname() + 4 >> 2] = winterNamePtr
                }
            }

            function _localtime_r(time, tmPtr) {
                _tzset();
                var date = new Date(HEAP32[time >> 2] * 1e3);
                HEAP32[tmPtr >> 2] = date.getSeconds();
                HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
                HEAP32[tmPtr + 8 >> 2] = date.getHours();
                HEAP32[tmPtr + 12 >> 2] = date.getDate();
                HEAP32[tmPtr + 16 >> 2] = date.getMonth();
                HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
                HEAP32[tmPtr + 24 >> 2] = date.getDay();
                var start = new Date(date.getFullYear(), 0, 1);
                var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
                HEAP32[tmPtr + 28 >> 2] = yday;
                HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
                var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
                var winterOffset = start.getTimezoneOffset();
                var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
                HEAP32[tmPtr + 32 >> 2] = dst;
                var zonePtr = HEAP32[__get_tzname() + (dst ? 4 : 0) >> 2];
                HEAP32[tmPtr + 40 >> 2] = zonePtr;
                return tmPtr
            }

            function _mktime(tmPtr) {
                _tzset();
                var date = new Date(HEAP32[tmPtr + 20 >> 2] + 1900, HEAP32[tmPtr + 16 >> 2], HEAP32[tmPtr + 12 >> 2], HEAP32[tmPtr + 8 >> 2], HEAP32[tmPtr + 4 >> 2], HEAP32[tmPtr >> 2], 0);
                var dst = HEAP32[tmPtr + 32 >> 2];
                var guessedOffset = date.getTimezoneOffset();
                var start = new Date(date.getFullYear(), 0, 1);
                var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
                var winterOffset = start.getTimezoneOffset();
                var dstOffset = Math.min(winterOffset, summerOffset);
                if (dst < 0) {
                    HEAP32[tmPtr + 32 >> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset)
                } else if (dst > 0 != (dstOffset == guessedOffset)) {
                    var nonDstOffset = Math.max(winterOffset, summerOffset);
                    var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
                    date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4)
                }
                HEAP32[tmPtr + 24 >> 2] = date.getDay();
                var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
                HEAP32[tmPtr + 28 >> 2] = yday;
                HEAP32[tmPtr >> 2] = date.getSeconds();
                HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
                HEAP32[tmPtr + 8 >> 2] = date.getHours();
                HEAP32[tmPtr + 12 >> 2] = date.getDate();
                HEAP32[tmPtr + 16 >> 2] = date.getMonth();
                return date.getTime() / 1e3 | 0
            }

            function _pthread_create() {
                return 6
            }

            function _pthread_join() {
                return 28
            }

            function _setTempRet0($i) {
                setTempRet0($i | 0)
            }

            function __isLeapYear(year) {
                return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
            }

            function __arraySum(array, index) {
                var sum = 0;
                for (var i = 0; i <= index; sum += array[i++]) {
                }
                return sum
            }

            var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            function __addDays(date, days) {
                var newDate = new Date(date.getTime());
                while (days > 0) {
                    var leap = __isLeapYear(newDate.getFullYear());
                    var currentMonth = newDate.getMonth();
                    var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
                    if (days > daysInCurrentMonth - newDate.getDate()) {
                        days -= daysInCurrentMonth - newDate.getDate() + 1;
                        newDate.setDate(1);
                        if (currentMonth < 11) {
                            newDate.setMonth(currentMonth + 1)
                        } else {
                            newDate.setMonth(0);
                            newDate.setFullYear(newDate.getFullYear() + 1)
                        }
                    } else {
                        newDate.setDate(newDate.getDate() + days);
                        return newDate
                    }
                }
                return newDate
            }

            function _strftime(s, maxsize, format, tm) {
                var tm_zone = HEAP32[tm + 40 >> 2];
                var date = {
                    tm_sec: HEAP32[tm >> 2],
                    tm_min: HEAP32[tm + 4 >> 2],
                    tm_hour: HEAP32[tm + 8 >> 2],
                    tm_mday: HEAP32[tm + 12 >> 2],
                    tm_mon: HEAP32[tm + 16 >> 2],
                    tm_year: HEAP32[tm + 20 >> 2],
                    tm_wday: HEAP32[tm + 24 >> 2],
                    tm_yday: HEAP32[tm + 28 >> 2],
                    tm_isdst: HEAP32[tm + 32 >> 2],
                    tm_gmtoff: HEAP32[tm + 36 >> 2],
                    tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
                };
                var pattern = UTF8ToString(format);
                var EXPANSION_RULES_1 = {
                    "%c": "%a %b %d %H:%M:%S %Y",
                    "%D": "%m/%d/%y",
                    "%F": "%Y-%m-%d",
                    "%h": "%b",
                    "%r": "%I:%M:%S %p",
                    "%R": "%H:%M",
                    "%T": "%H:%M:%S",
                    "%x": "%m/%d/%y",
                    "%X": "%H:%M:%S",
                    "%Ec": "%c",
                    "%EC": "%C",
                    "%Ex": "%m/%d/%y",
                    "%EX": "%H:%M:%S",
                    "%Ey": "%y",
                    "%EY": "%Y",
                    "%Od": "%d",
                    "%Oe": "%e",
                    "%OH": "%H",
                    "%OI": "%I",
                    "%Om": "%m",
                    "%OM": "%M",
                    "%OS": "%S",
                    "%Ou": "%u",
                    "%OU": "%U",
                    "%OV": "%V",
                    "%Ow": "%w",
                    "%OW": "%W",
                    "%Oy": "%y"
                };
                for (var rule in EXPANSION_RULES_1) {
                    pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule])
                }
                var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

                function leadingSomething(value, digits, character) {
                    var str = typeof value === "number" ? value.toString() : value || "";
                    while (str.length < digits) {
                        str = character[0] + str
                    }
                    return str
                }

                function leadingNulls(value, digits) {
                    return leadingSomething(value, digits, "0")
                }

                function compareByDay(date1, date2) {
                    function sgn(value) {
                        return value < 0 ? -1 : value > 0 ? 1 : 0
                    }

                    var compare;
                    if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
                        if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                            compare = sgn(date1.getDate() - date2.getDate())
                        }
                    }
                    return compare
                }

                function getFirstWeekStartDate(janFourth) {
                    switch (janFourth.getDay()) {
                        case 0:
                            return new Date(janFourth.getFullYear() - 1, 11, 29);
                        case 1:
                            return janFourth;
                        case 2:
                            return new Date(janFourth.getFullYear(), 0, 3);
                        case 3:
                            return new Date(janFourth.getFullYear(), 0, 2);
                        case 4:
                            return new Date(janFourth.getFullYear(), 0, 1);
                        case 5:
                            return new Date(janFourth.getFullYear() - 1, 11, 31);
                        case 6:
                            return new Date(janFourth.getFullYear() - 1, 11, 30)
                    }
                }

                function getWeekBasedYear(date) {
                    var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
                    var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
                    var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
                    var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
                    var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
                    if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
                        if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                            return thisDate.getFullYear() + 1
                        } else {
                            return thisDate.getFullYear()
                        }
                    } else {
                        return thisDate.getFullYear() - 1
                    }
                }

                var EXPANSION_RULES_2 = {
                    "%a": function (date) {
                        return WEEKDAYS[date.tm_wday].substring(0, 3)
                    }, "%A": function (date) {
                        return WEEKDAYS[date.tm_wday]
                    }, "%b": function (date) {
                        return MONTHS[date.tm_mon].substring(0, 3)
                    }, "%B": function (date) {
                        return MONTHS[date.tm_mon]
                    }, "%C": function (date) {
                        var year = date.tm_year + 1900;
                        return leadingNulls(year / 100 | 0, 2)
                    }, "%d": function (date) {
                        return leadingNulls(date.tm_mday, 2)
                    }, "%e": function (date) {
                        return leadingSomething(date.tm_mday, 2, " ")
                    }, "%g": function (date) {
                        return getWeekBasedYear(date).toString().substring(2)
                    }, "%G": function (date) {
                        return getWeekBasedYear(date)
                    }, "%H": function (date) {
                        return leadingNulls(date.tm_hour, 2)
                    }, "%I": function (date) {
                        var twelveHour = date.tm_hour;
                        if (twelveHour == 0) twelveHour = 12; else if (twelveHour > 12) twelveHour -= 12;
                        return leadingNulls(twelveHour, 2)
                    }, "%j": function (date) {
                        return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3)
                    }, "%m": function (date) {
                        return leadingNulls(date.tm_mon + 1, 2)
                    }, "%M": function (date) {
                        return leadingNulls(date.tm_min, 2)
                    }, "%n": function () {
                        return "\n"
                    }, "%p": function (date) {
                        if (date.tm_hour >= 0 && date.tm_hour < 12) {
                            return "AM"
                        } else {
                            return "PM"
                        }
                    }, "%S": function (date) {
                        return leadingNulls(date.tm_sec, 2)
                    }, "%t": function () {
                        return "\t"
                    }, "%u": function (date) {
                        return date.tm_wday || 7
                    }, "%U": function (date) {
                        var janFirst = new Date(date.tm_year + 1900, 0, 1);
                        var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
                        var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
                        if (compareByDay(firstSunday, endDate) < 0) {
                            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                            var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
                            var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                            return leadingNulls(Math.ceil(days / 7), 2)
                        }
                        return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00"
                    }, "%V": function (date) {
                        var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
                        var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
                        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
                        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
                        var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
                        if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                            return "53"
                        }
                        if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                            return "01"
                        }
                        var daysDifference;
                        if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
                            daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate()
                        } else {
                            daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate()
                        }
                        return leadingNulls(Math.ceil(daysDifference / 7), 2)
                    }, "%w": function (date) {
                        return date.tm_wday
                    }, "%W": function (date) {
                        var janFirst = new Date(date.tm_year, 0, 1);
                        var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
                        var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
                        if (compareByDay(firstMonday, endDate) < 0) {
                            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                            var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
                            var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                            return leadingNulls(Math.ceil(days / 7), 2)
                        }
                        return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00"
                    }, "%y": function (date) {
                        return (date.tm_year + 1900).toString().substring(2)
                    }, "%Y": function (date) {
                        return date.tm_year + 1900
                    }, "%z": function (date) {
                        var off = date.tm_gmtoff;
                        var ahead = off >= 0;
                        off = Math.abs(off) / 60;
                        off = off / 60 * 100 + off % 60;
                        return (ahead ? "+" : "-") + String("0000" + off).slice(-4)
                    }, "%Z": function (date) {
                        return date.tm_zone
                    }, "%%": function () {
                        return "%"
                    }
                };
                for (var rule in EXPANSION_RULES_2) {
                    if (pattern.indexOf(rule) >= 0) {
                        pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date))
                    }
                }
                var bytes = intArrayFromString(pattern, false);
                if (bytes.length > maxsize) {
                    return 0
                }
                writeArrayToMemory(bytes, s);
                return bytes.length - 1
            }

            function _strftime_l(s, maxsize, format, tm) {
                return _strftime(s, maxsize, format, tm)
            }

            function _time(ptr) {
                var ret = Date.now() / 1e3 | 0;
                if (ptr) {
                    HEAP32[ptr >> 2] = ret
                }
                return ret
            }

            InternalError = Module["InternalError"] = extendError(Error, "InternalError");
            embind_init_charCodes();
            BindingError = Module["BindingError"] = extendError(Error, "BindingError");
            init_ClassHandle();
            init_RegisteredPointer();
            init_embind();
            UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
            init_emval();

            function intArrayFromString(stringy, dontAddNull, length) {
                var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
                var u8array = new Array(len);
                var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
                if (dontAddNull) u8array.length = numBytesWritten;
                return u8array
            }

            var asmLibraryArg = {
                "w": ___sys_fcntl64,
                "U": ___sys_ioctl,
                "R": ___sys_mmap2,
                "S": ___sys_munmap,
                "u": ___sys_open,
                "F": __embind_finalize_value_object,
                "X": __embind_register_bool,
                "c": __embind_register_class,
                "l": __embind_register_class_class_function,
                "h": __embind_register_class_constructor,
                "b": __embind_register_class_function,
                "f": __embind_register_class_property,
                "W": __embind_register_emval,
                "x": __embind_register_float,
                "i": __embind_register_integer,
                "e": __embind_register_memory_view,
                "y": __embind_register_std_string,
                "q": __embind_register_std_wstring,
                "G": __embind_register_value_object,
                "k": __embind_register_value_object_field,
                "Y": __embind_register_void,
                "H": __emval_as,
                "ea": __emval_call_method,
                "t": __emval_call_void_method,
                "g": __emval_decref,
                "da": __emval_get_global,
                "s": __emval_get_method_caller,
                "Q": __emval_get_property,
                "m": __emval_incref,
                "ca": __emval_new,
                "V": __emval_new_cstring,
                "E": __emval_run_destructors,
                "d": __emval_take_value,
                "_": __exit,
                "a": _abort,
                "z": _clock_gettime,
                "aa": _dlopen,
                "A": _dlsym,
                "T": _emscripten_get_heap_max,
                "J": _emscripten_memcpy_big,
                "K": _emscripten_resize_heap,
                "P": _emscripten_thread_sleep,
                "N": _environ_get,
                "O": _environ_sizes_get,
                "ba": _exit,
                "p": _fd_close,
                "v": _fd_read,
                "I": _fd_seek,
                "o": _fd_write,
                "L": _getentropy,
                "$": _gettimeofday,
                "Z": _gmtime_r,
                "j": _localtime_r,
                "C": _mktime,
                "r": _pthread_create,
                "B": _pthread_join,
                "n": _setTempRet0,
                "M": _strftime_l,
                "D": _time
            };
            var asm = createWasm();
            var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function () {
                return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["ga"]).apply(null, arguments)
            };
            var _memset = Module["_memset"] = function () {
                return (_memset = Module["_memset"] = Module["asm"]["ha"]).apply(null, arguments)
            };
            var _malloc = Module["_malloc"] = function () {
                return (_malloc = Module["_malloc"] = Module["asm"]["ia"]).apply(null, arguments)
            };
            var ___errno_location = Module["___errno_location"] = function () {
                return (___errno_location = Module["___errno_location"] = Module["asm"]["ka"]).apply(null, arguments)
            };
            var _free = Module["_free"] = function () {
                return (_free = Module["_free"] = Module["asm"]["la"]).apply(null, arguments)
            };
            var ___getTypeName = Module["___getTypeName"] = function () {
                return (___getTypeName = Module["___getTypeName"] = Module["asm"]["ma"]).apply(null, arguments)
            };
            var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = function () {
                return (___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = Module["asm"]["na"]).apply(null, arguments)
            };
            var __get_tzname = Module["__get_tzname"] = function () {
                return (__get_tzname = Module["__get_tzname"] = Module["asm"]["oa"]).apply(null, arguments)
            };
            var __get_daylight = Module["__get_daylight"] = function () {
                return (__get_daylight = Module["__get_daylight"] = Module["asm"]["pa"]).apply(null, arguments)
            };
            var __get_timezone = Module["__get_timezone"] = function () {
                return (__get_timezone = Module["__get_timezone"] = Module["asm"]["qa"]).apply(null, arguments)
            };
            var _memalign = Module["_memalign"] = function () {
                return (_memalign = Module["_memalign"] = Module["asm"]["ra"]).apply(null, arguments)
            };
            var dynCall_viijii = Module["dynCall_viijii"] = function () {
                return (dynCall_viijii = Module["dynCall_viijii"] = Module["asm"]["sa"]).apply(null, arguments)
            };
            var dynCall_jiiji = Module["dynCall_jiiji"] = function () {
                return (dynCall_jiiji = Module["dynCall_jiiji"] = Module["asm"]["ta"]).apply(null, arguments)
            };
            var dynCall_iiij = Module["dynCall_iiij"] = function () {
                return (dynCall_iiij = Module["dynCall_iiij"] = Module["asm"]["ua"]).apply(null, arguments)
            };
            var dynCall_jiiiji = Module["dynCall_jiiiji"] = function () {
                return (dynCall_jiiiji = Module["dynCall_jiiiji"] = Module["asm"]["va"]).apply(null, arguments)
            };
            var dynCall_vij = Module["dynCall_vij"] = function () {
                return (dynCall_vij = Module["dynCall_vij"] = Module["asm"]["wa"]).apply(null, arguments)
            };
            var dynCall_jjj = Module["dynCall_jjj"] = function () {
                return (dynCall_jjj = Module["dynCall_jjj"] = Module["asm"]["xa"]).apply(null, arguments)
            };
            var dynCall_iiiijj = Module["dynCall_iiiijj"] = function () {
                return (dynCall_iiiijj = Module["dynCall_iiiijj"] = Module["asm"]["ya"]).apply(null, arguments)
            };
            var dynCall_viijj = Module["dynCall_viijj"] = function () {
                return (dynCall_viijj = Module["dynCall_viijj"] = Module["asm"]["za"]).apply(null, arguments)
            };
            var dynCall_viiijjjj = Module["dynCall_viiijjjj"] = function () {
                return (dynCall_viiijjjj = Module["dynCall_viiijjjj"] = Module["asm"]["Aa"]).apply(null, arguments)
            };
            var dynCall_vj = Module["dynCall_vj"] = function () {
                return (dynCall_vj = Module["dynCall_vj"] = Module["asm"]["Ba"]).apply(null, arguments)
            };
            var dynCall_viij = Module["dynCall_viij"] = function () {
                return (dynCall_viij = Module["dynCall_viij"] = Module["asm"]["Ca"]).apply(null, arguments)
            };
            var dynCall_viiiiij = Module["dynCall_viiiiij"] = function () {
                return (dynCall_viiiiij = Module["dynCall_viiiiij"] = Module["asm"]["Da"]).apply(null, arguments)
            };
            var dynCall_iijjiiii = Module["dynCall_iijjiiii"] = function () {
                return (dynCall_iijjiiii = Module["dynCall_iijjiiii"] = Module["asm"]["Ea"]).apply(null, arguments)
            };
            var dynCall_jiji = Module["dynCall_jiji"] = function () {
                return (dynCall_jiji = Module["dynCall_jiji"] = Module["asm"]["Fa"]).apply(null, arguments)
            };
            var dynCall_iiiiij = Module["dynCall_iiiiij"] = function () {
                return (dynCall_iiiiij = Module["dynCall_iiiiij"] = Module["asm"]["Ga"]).apply(null, arguments)
            };
            var dynCall_iiiiijj = Module["dynCall_iiiiijj"] = function () {
                return (dynCall_iiiiijj = Module["dynCall_iiiiijj"] = Module["asm"]["Ha"]).apply(null, arguments)
            };
            var dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = function () {
                return (dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = Module["asm"]["Ia"]).apply(null, arguments)
            };
            var calledRun;

            function ExitStatus(status) {
                this.name = "ExitStatus";
                this.message = "Program terminated with exit(" + status + ")";
                this.status = status
            }

            dependenciesFulfilled = function runCaller() {
                if (!calledRun) run();
                if (!calledRun) dependenciesFulfilled = runCaller
            };

            function run(args) {
                args = args || arguments_;
                if (runDependencies > 0) {
                    return
                }
                preRun();
                if (runDependencies > 0) {
                    return
                }

                function doRun() {
                    if (calledRun) return;
                    calledRun = true;
                    Module["calledRun"] = true;
                    if (ABORT) return;
                    initRuntime();
                    preMain();
                    readyPromiseResolve(Module);
                    if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
                    postRun()
                }

                if (Module["setStatus"]) {
                    Module["setStatus"]("Running...");
                    setTimeout(function () {
                        setTimeout(function () {
                            Module["setStatus"]("")
                        }, 1);
                        doRun()
                    }, 1)
                } else {
                    doRun()
                }
            }

            Module["run"] = run;

            function exit(status, implicit) {
                EXITSTATUS = status;
                if (implicit && keepRuntimeAlive() && status === 0) {
                    return
                }
                if (keepRuntimeAlive()) {
                } else {
                    exitRuntime();
                    if (Module["onExit"]) Module["onExit"](status);
                    ABORT = true
                }
                quit_(status, new ExitStatus(status))
            }

            if (Module["preInit"]) {
                if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
                while (Module["preInit"].length > 0) {
                    Module["preInit"].pop()()
                }
            }
            run();


            return tflite_web_api_ModuleFactory.ready
        }
    );
})();
if (typeof exports === 'object' && typeof module === 'object')
    module.exports = tflite_web_api_ModuleFactory;
else if (typeof define === 'function' && define['amd'])
    define([], function () {
        return tflite_web_api_ModuleFactory;
    });
else if (typeof exports === 'object')
    exports["tflite_web_api_ModuleFactory"] = tflite_web_api_ModuleFactory;
