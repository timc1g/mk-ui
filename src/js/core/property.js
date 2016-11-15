
// property
//
// ES5 defineProperty, propertyDescriptor, etc. to allow getters,
// setters, and hyjack vanilla functions to take advantage of super() -
// a dynamic method allowing super object references.
// -------------------------------------------------------------

function property (obj, proto, member) {

    var desc = Object.getOwnPropertyDescriptor(proto, member),
        prop, fn;

    if (typeof desc.get !== 'undefined') {
        return Object.defineProperty(obj, member, desc);
    }

    prop = proto[member];

    if (!basicFunction(prop)) {
        return obj[member] = copy(prop);
    }

    fn = wrapFunction(prop, member);

    Object.defineProperty(obj, member, {

        get: function () {
            return fn;
        },

        set: function (value) {

            var v = value;

            if (basicFunction(value)) {
                v = wrapFunction(value);
            }

            fn = v;
        }
    });
}

//
// wrap vanilla functions to allow super() cabability
//

function wrapFunction (fn, m) {

    if (fn._id_) {
        return fn;
    }

    var func = function () {

        this._pushsuper_(m);

        var r = fn.apply(this, arguments);

        this._popsuper_(m);

        return r;
    };

    func._id_ = uid();

    func.toString = function () {
        return fn.toString();
    };

    return func;
}

//
// keeps track of call stacks
// which allows super() to be called properly
// with nested functions (functions calling other functions calling super)
//

function pushsuper (m) {

    var ch = this._chain_ = this._chain_ || [],
        st = this._stack_ = this._stack_ || [],
        i  = ch.lastIndexOf(m),
        s  = this._super_,
        p  = s && s.prototype || {},
        f  = this[m];

    if (i > -1) {
        s = st[i].super.prototype._super_ || null;
        p = s && s.prototype || {};
    }

    while (s !== null
        && p.hasOwnProperty(m)
        && p[m]._id_ === f._id_) {

        s = p._super_ || null;
        p = s && s.prototype || {};
    }

    st.push({method: m, super: s});
    ch.push(m);
}

//
// pop functions out of the call stack
// to keep super() context in place
//

function popsuper (m) {

    var ch = this._chain_ = this._chain_ || [],
        st = this._stack_ = this._stack_ || [],
        i  = ch.lastIndexOf(m);

    if (i > -1) {

        ch.splice(i, 1);
        st.splice(i, 1);
    }
}
