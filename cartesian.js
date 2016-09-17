
function alt() {
    var args = []
    for(var i = 0; i < arguments.length; i++) args.push(arguments[i])
    return {__cartesian__: 'alt', arguments: args}
}

function mix() {
    var args = []
    for(var i = 0; i < arguments.length; i++) args.push(arguments[i])
    return {__cartesian__: 'mix', arguments: args}
}

function cut(s, predicate) {
    return {__cartesian__: 'cut', s: s, predicate: predicate}
}

function wrapper(prop, fn) {
    var val = fn.call(this)
    delete this[prop]
    Object.defineProperty(this, prop, {enumerable: true, value: val})
    return val
}

function memoize(dst, prop, fn) {
    Object.defineProperty(dst, prop, {
        configurable: true,
        enumerable: true,
        get: wrapper.bind(dst, prop, fn)})
}

function copy(dst, src) {
    for(var prop in src) {
        var desc = Object.getOwnPropertyDescriptor(src, prop)
        if(desc.get === undefined) {
            Object.defineProperty(dst, prop, desc)
            continue
        }
        memoize(dst, prop, desc.get)
    }
}

function expand(expr) {
    // primitive type
    if(typeof(expr) !== 'object') return [expr]
    // mix()
    if(expr.__cartesian__ === 'mix') {
        if(expr.arguments.length == 0) return [{}]
        var head = expand(expr.arguments[0])
        var tail = expand(mix.apply(this, expr.arguments.slice(1)))
        var res = []
        for(var i = 0; i < head.length; i++) {
            for(var j = 0; j < tail.length; j++) {
                var obj = {}
                copy(obj, head[i])
                copy(obj, tail[j])
                res.push(obj)
            }
        }
        return res
    }
    // alt()
    if(expr.__cartesian__ === 'alt') {
        var res = []
        for(var i = 0; i < expr.arguments.length; i++) {
            var s = expand(expr.arguments[i])
            for(var j = 0; j < s.length; j++) res.push(s[j])
        }
        return res
    }
    // cut()
    if(expr.__cartesian__ === 'cut') {
        var s = expand(expr.s)
        var res = []
        for(key in s) if(!expr.predicate.apply(s[key])) res.push(s[key])
        return res
    }
    // array
    if(Array.isArray(expr)) {
        if(expr.length == 0) return [[]]
        var head = expand(expr[0])
        var tail = expand(expr.slice(1))
        var res = []
        for(var i = 0; i < head.length; i++) {
            for(var j =  0; j < tail.length; j++)
                res.push([head[i]].concat(tail[j]))
        }
        return res
    }
    // object
    res = [{}]
    for(var name in expr) {
        var desc = Object.getOwnPropertyDescriptor(expr, name)
        if(desc.get != undefined) {
            for(var i = 0; i < res.length; i++)
                memoize(res[i], name, desc.get)
            continue;
        }
        var s = expand(expr[name])
        var old = res
        res = []
        for(var i = 0; i < old.length; i++) {
            for(var j = 0; j < s.length; j++) {
                var obj = {}
                copy(obj, old[i])
                obj[name] = s[j]
                res.push(obj)
            }
        }
    }
    return res
}

function degetterize(s) {
    if(typeof(s) !== 'object') return
    for(prop in s) degetterize(s[prop])
}

function defunctionize(s) {
    if(typeof(s) !== 'object') return
    for(prop in s) {
        if(typeof(s[prop]) === "function")
            delete s[prop]
        else
            defunctionize(s[prop])
    }
}

function evaluate(expr) {
    var s = expand(expr)
    degetterize(s)
    defunctionize(s)
    return s
}

exports.alt = alt
exports.mix = mix
exports.cut = cut
exports.evaluate = evaluate

