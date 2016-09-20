
/******************************************************************************/
/*  Functions to construct the syntax tree.                                   */
/******************************************************************************/

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

function keep(s, predicate) {
    return {__cartesian__: 'keep', s: s, predicate: predicate}
}

function cut(s, predicate) {
    return {__cartesian__: 'cut', s: s, predicate: predicate}
}

function sum(name) {
    return {__cartesian__: 'sum', name: name}
}

function inc(name, value) {
    return {__cartesian__: 'inc', name: name, value: value}
}

/******************************************************************************/
/*  Memoization helpers.                                                      */
/******************************************************************************/

function wrapper(prop, fn) {
    var val = fn.call(this)
    delete this[prop]
    Object.defineProperty(this, prop, {enumerable: true, value: val})
    return val
}

function memoize(dst, prop, fn) {
    if('__memoized__' in fn) {
        var memofn = fn
    }
    else {
        var memofn = wrapper.bind(dst, prop, fn)
        memofn.__memoized__ = true
    }
    Object.defineProperty(dst, prop, {
        configurable: true,
        enumerable: true,
        get: memofn})
}

/******************************************************************************/
/*  Evaluation, step 1. The syntax tree is expanded to actual objects.        */
/*  No user-defined getters or functions are evaluated during this phase.     */
/******************************************************************************/

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
    // keep()
    if(expr.__cartesian__ === 'keep') {
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
    // Expressions that are not evaluated in step 1.
    if(expr.__cartesian__ in ['sum', 'inc']) {
        return [expr]
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

/******************************************************************************/
/*  Evaluation, step 2. Sum statements are linked to summarization objects.   */
/*  Some getters may be evaluated during this phase, specifically, those      */
/*  that are needed to construct summarization identifiers.                   */
/******************************************************************************/

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
        if(s[prop].__cartesian__ !== 'sum' && s[prop].__cartesian__ !== 'inc') {
            makegraph(s[prop], env)
            continue
        }
        var name = s[prop].name
        // This evaluation happens before sums are fully computed!
        if(typeof(name) === 'function') name = name.call(s)
        // Create a global variable if it does not exist yet.
        if(!(name in env)) env[name] = {base: 0, contributors: []}
        if(s[prop].__cartesian__ === 'sum') {
            memoize(s, prop, summarize.bind(env[name]))
            continue
        }
        // inc()
        var value = s[prop].value
        if(typeof(value) === 'function') {
            env[name].contributors.push(value.bind(s))
            memoize(s, prop, value.bind(s))
        }
        else {
            env[name].base += value
            s[prop] = value
        }
    }
}

/******************************************************************************/
/*  Evaluation as such.                                                       */
/******************************************************************************/

function evaluate(expr) {
    var s = expand(expr)
    makegraph(s, {})
    return s
}

/******************************************************************************/
/*  Exports.                                                                  */
/******************************************************************************/

exports.alt = alt
exports.mix = mix
exports.sum = sum
exports.inc = inc
exports.join = join
exports.keep = keep
exports.cut = cut
exports.evaluate = evaluate

