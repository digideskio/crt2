
var c = require('./cartesian.js')
var alt = c.alt
var mix = c.mix
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

// Test subset.
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

