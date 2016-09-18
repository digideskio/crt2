
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

function join() {
    var args = []
    for(var i = 0; i < arguments.length; i++) args.push(arguments[i])
    return {__cartesian__: 'join', arguments: args}
}

function filter(s, predicate) {
    return {__cartesian__: 'filter', s: s, predicate: predicate}
}

function cut(s, predicate) {
    return {__cartesian__: 'cut', s: s, predicate: predicate}
}

function sum(name) {
    var value = arguments.length > 1 ? arguments[1] : 0
    return {__cartesian__: 'sum', name: name, value: value}
}

function wrapper(prop, fn) {
    var val = fn.call(this)
    delete this[prop]
    Object.defineProperty(this, prop, {enumerable: true, value: val})
    return val
}

function memoize(dst, prop, fn) {
    // TODO: Prevent multiple memoization.
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
    // join()
    if(expr.__cartesian__ === 'join') {
        var res = []
        for(var i = 0; i < expr.arguments.length; i++)
            res = res.concat(expand(expr.arguments[i]))
        return res
    }
    // filter()
    if(expr.__cartesian__ === 'filter') {
        var s = expand(expr.s)
        var res = []
        for(key in s) if(expr.predicate.apply(s[key])) res.push(s[key])
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

function summarize() {
    for(var i = 0; i < this.contributors.length; i++)
        this.base += this.contributors[i]()
    this.contributors = []
    return this.base
}

function makegraph(s, env) {
    if(typeof(s) !== 'object') return
    for(prop in s) {
        var desc = Object.getOwnPropertyDescriptor(s, prop)
        if(desc.get != undefined) continue
        if(s[prop].__cartesian__ !== 'sum') {
            makegraph(s[prop], env)
            continue
        }
        var name = s[prop].name
        var value = s[prop].value
        // This evaluation happens before sums are fully computed!
        if(typeof(name) === 'function') name = name.call(s)
        // Create a global variable if it does not exist yet.
        if(!(name in env)) env[name] = {base: 0, contributors: []}
        if(typeof(value) === 'function')
            env[name].contributors.push(value.bind(s))
        else
            env[name].base += value
        delete s[prop]
        Object.defineProperty(s, prop, {
            enumerable: true,
            get: summarize.bind(env[name])
        })
    }
}

function defunctionize(s) {
    if(typeof(s) !== 'object') return
    for(prop in s) {
        var desc = Object.getOwnPropertyDescriptor(s, prop)
        if(desc.get != undefined) continue
        if(typeof(s[prop]) === "function")
            delete s[prop]
        else
            defunctionize(s[prop])
    }
}

function evaluate(expr) {
    var s = expand(expr)
    makegraph(s, {})
    defunctionize(s)
    return s
}

exports.alt = alt
exports.mix = mix
exports.sum = sum
exports.join = join
exports.filter = filter
exports.cut = cut
exports.evaluate = evaluate

