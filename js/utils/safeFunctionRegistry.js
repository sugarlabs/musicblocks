/*
 Simple, explicit function registry and safe global resolver.
 Exposes a global SafeRegistry with:
 - register(category, key, fn)
 - get(category, key)
 - has(category, key)
 - invoke(category, key, ctx)
 - resolvePath(path, root)
*/

(function(rootFactory){
    if (typeof define === "function" && define.amd) {
        define([], rootFactory);
    } else {
        rootFactory();
    }
})(function(){
    var CATEGORIES = ["arg","flow","parameter","setter","onstart","onstop"];
    var _store = {};
    CATEGORIES.forEach(function(c){ _store[c] = Object.create(null); });

    function register(category, key, fn){
        if (!CATEGORIES.includes(category)) throw new Error("Unknown category: "+category);
        if (typeof key !== "string" || !key) throw new Error("Invalid key for registry");
        if (typeof fn !== "function") throw new Error("Registered value must be a function");
        _store[category][key] = fn;
    }

    function get(category, key){
        return _store[category] && _store[category][key] || null;
    }

    function has(category, key){
        return !!get(category, key);
    }

    function invoke(category, key, ctx){
        var fn = get(category, key);
        if (!fn) throw new Error("Unsupported action: "+category+":"+key);
        return fn(ctx);
    }

    function resolvePath(path, root){
        if (typeof path !== "string" || !path) return null;
        var parts = path.split(".");
        var obj = root || (typeof window !== "undefined" ? window : globalThis);
        for (var i=0; i<parts.length; i++){
            if (parts[i] === "prototype" && obj && obj.prototype){
                obj = obj.prototype;
                continue;
            }
            obj = obj ? obj[parts[i]] : undefined;
            if (obj === undefined || obj === null) return null;
        }
        return obj;
    }

    var api = {
        register: register,
        get: get,
        has: has,
        invoke: invoke,
        resolvePath: resolvePath
    };

    if (typeof window !== "undefined") {
        window.SafeRegistry = api;
    } else if (typeof globalThis !== "undefined") {
        globalThis.SafeRegistry = api;
    }

    return api;
});
