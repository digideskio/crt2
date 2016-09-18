
var c = require('./cartesian.js')
var alt = c.alt
var mix = c.mix
var sum = c.sum
var join = c.join
var keep = c.keep
var cut = c.cut
var evaluate = c.evaluate

function test(s, expected) {
    result = JSON.stringify(evaluate(s), null, 2)
    if(result != expected) throw Error('\n' + result + '\n!=\n' + expected)
}

// Primitive type.
s = 3
test(s,
'[\n\
  3\n\
]')

// Alt of primitive types.
s = alt(1, 2, 3)
test(s,
'[\n\
  1,\n\
  2,\n\
  3\n\
]')


// Trivial set.
s = {a:1, b:2}
test(s,
'[\n\
  {\n\
    "a": 1,\n\
    "b": 2\n\
  }\n\
]')

// Trivial alt.
s = alt({a:1, b:2})
test(s,
'[\n\
  {\n\
    "a": 1,\n\
    "b": 2\n\
  }\n\
]')

// Alt of two objects.
s = alt({a:1, b:2}, {c:3, d:4})
test(s,
'[\n\
  {\n\
    "a": 1,\n\
    "b": 2\n\
  },\n\
  {\n\
    "c": 3,\n\
    "d": 4\n\
  }\n\
]')

// Alt of non-trivial sets.
a1 = alt({a:1, b:2}, {c:3, d:4})
a2 = alt({e:5, f:6}, {g:7, h:8}) 
s = alt(a1, a2)
test(s,
'[\n\
  {\n\
    "a": 1,\n\
    "b": 2\n\
  },\n\
  {\n\
    "c": 3,\n\
    "d": 4\n\
  },\n\
  {\n\
    "e": 5,\n\
    "f": 6\n\
  },\n\
  {\n\
    "g": 7,\n\
    "h": 8\n\
  }\n\
]')

// Trivial mixin.
s = mix({a:1, b:2})
test(s,
'[\n\
  {\n\
    "a": 1,\n\
    "b": 2\n\
  }\n\
]')

// Test 2x2 cross product.
s = mix(a1, a2)
test(s,
'[\n\
  {\n\
    "a": 1,\n\
    "b": 2,\n\
    "e": 5,\n\
    "f": 6\n\
  },\n\
  {\n\
    "a": 1,\n\
    "b": 2,\n\
    "g": 7,\n\
    "h": 8\n\
  },\n\
  {\n\
    "c": 3,\n\
    "d": 4,\n\
    "e": 5,\n\
    "f": 6\n\
  },\n\
  {\n\
    "c": 3,\n\
    "d": 4,\n\
    "g": 7,\n\
    "h": 8\n\
  }\n\
]')

// Test that properties are shadowed in correct order.
s = mix({a:1, b:2}, {a:3})
test(s,
'[\n\
  {\n\
    "a": 3,\n\
    "b": 2\n\
  }\n\
]')

// Test getters.
s = {
    get a() {return 1}
}
test(s,
'[\n\
  {\n\
    "a": 1\n\
  }\n\
]')

// Reference 'this' from a getter.
s = {
    a: 1,
    get b() {return this.a + 1},
    get c() {return this.b + 1}
}
test(s,
'[\n\
  {\n\
    "a": 1,\n\
    "b": 2,\n\
    "c": 3\n\
  }\n\
]')

// Test aggregation.
s = {u1: alt({a:1}, {a:2}), u2: alt({b:1}, {b:2}), c: 3}
test(s,
'[\n\
  {\n\
    "u1": {\n\
      "a": 1\n\
    },\n\
    "u2": {\n\
      "b": 1\n\
    },\n\
    "c": 3\n\
  },\n\
  {\n\
    "u1": {\n\
      "a": 1\n\
    },\n\
    "u2": {\n\
      "b": 2\n\
    },\n\
    "c": 3\n\
  },\n\
  {\n\
    "u1": {\n\
      "a": 2\n\
    },\n\
    "u2": {\n\
      "b": 1\n\
    },\n\
    "c": 3\n\
  },\n\
  {\n\
    "u1": {\n\
      "a": 2\n\
    },\n\
    "u2": {\n\
      "b": 2\n\
    },\n\
    "c": 3\n\
  }\n\
]')

// Test cut.
s = cut(s, function() {return this.u1.a == this.u2.b})
test(s,
'[\n\
  {\n\
    "u1": {\n\
      "a": 1\n\
    },\n\
    "u2": {\n\
      "b": 2\n\
    },\n\
    "c": 3\n\
  },\n\
  {\n\
    "u1": {\n\
      "a": 2\n\
    },\n\
    "u2": {\n\
      "b": 1\n\
    },\n\
    "c": 3\n\
  }\n\
]')

// Test keep.
s = keep({
  a: alt(1, 2, 3),
  b: alt(1, 2, 3)
}, function() {return this.a == this.b})
test(s,
'[\n\
  {\n\
    "a": 1,\n\
    "b": 1\n\
  },\n\
  {\n\
    "a": 2,\n\
    "b": 2\n\
  },\n\
  {\n\
    "a": 3,\n\
    "b": 3\n\
  }\n\
]')

// Test join.
s1 = {a: alt(1, 2, 3)}
s2 = {b: alt(1, 2, 3)}
s = join(s1, s2)
test(s,
'[\n\
  {\n\
    "a": 1\n\
  },\n\
  {\n\
    "a": 2\n\
  },\n\
  {\n\
    "a": 3\n\
  },\n\
  {\n\
    "b": 1\n\
  },\n\
  {\n\
    "b": 2\n\
  },\n\
  {\n\
    "b": 3\n\
  }\n\
]')

// Summing, simple test.
s = {
    a: alt(1, 2, 3),
    b: sum('foo', 100)
}
test(s,
'[\n\
  {\n\
    "a": 1,\n\
    "b": 300\n\
  },\n\
  {\n\
    "a": 2,\n\
    "b": 300\n\
  },\n\
  {\n\
    "a": 3,\n\
    "b": 300\n\
  }\n\
]')

// Summing, with function.
s = {
    a: alt(1, 2, 3),
    b: sum('foo', function() {return this.a})
}
test(s,
'[\n\
  {\n\
    "a": 1,\n\
    "b": 6\n\
  },\n\
  {\n\
    "a": 2,\n\
    "b": 6\n\
  },\n\
  {\n\
    "a": 3,\n\
    "b": 6\n\
  }\n\
]')

// Summing, computed name.
s = {
    a: alt(1, 2, 3),
    b: sum(function() {return this.c}, 100),
    c: 'foo'
}
test(s,
'[\n\
  {\n\
    "a": 1,\n\
    "c": "foo",\n\
    "b": 300\n\
  },\n\
  {\n\
    "a": 2,\n\
    "c": "foo",\n\
    "b": 300\n\
  },\n\
  {\n\
    "a": 3,\n\
    "c": "foo",\n\
    "b": 300\n\
  }\n\
]')

// Summing, among different kinds of objects.
s1 = {
  name: 's1',
  s: sum('foo')
}
s2 = {
  name: 's2',
  s: sum('foo', 100)
}
s = join(s1, s2)
test(s,
'[\n\
  {\n\
    "name": "s1",\n\
    "s": 100\n\
  },\n\
  {\n\
    "name": "s2",\n\
    "s": 100\n\
  }\n\
]')

