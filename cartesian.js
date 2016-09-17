
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


function evaluate(expr) {
    function copy(dst, src) {
        for(var prop in src) {
            var desc = Object.getOwnPropertyDescriptor(src, prop)
            Object.defineProperty(dst, prop, desc)
        }
    }
    // primitive type
    if(typeof(expr) !== 'object') return [expr]
    // mix()
    if(expr.__cartesian__ === 'mix') {
        if(expr.arguments.length == 0) return [{}]
        var head = evaluate(expr.arguments[0])
        var tail = evaluate(mix.apply(this, expr.arguments.slice(1)))
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
            var s = evaluate(expr.arguments[i])
            for(var j = 0; j < s.length; j++) res.push(s[j])
        }
        return res
    }
    // cut()
    if(expr.__cartesian__ === 'cut') {
        var s = evaluate(expr.s)
        var res = []
        for(key in s) if(!expr.predicate.apply(s[key])) res.push(s[key])
        return res
    }
    // array
    if(Array.isArray(expr)) {
        if(expr.length == 0) return [[]]
        var head = evaluate(expr[0])
        var tail = evaluate(expr.slice(1))
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
                Object.defineProperty(res[i], name, desc)
            continue;
        }
        var s = evaluate(expr[name])
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

exports.alt = alt
exports.mix = mix
exports.cut = cut
exports.evaluate = evaluate

