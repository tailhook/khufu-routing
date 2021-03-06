import {CANCEL} from 'khufu-runtime'

class _BaseRouter {
    constructor(parent, rel_path, tail) {
        this._rel_path = rel_path
        this._parent = parent || this
        this._root = parent && parent._root || this
        this._tail = tail
        this._query_fields = {}
    }
    _add_query(name, obj) {
        this._query_fields[name] = obj
        this._root._all_fields[name] = obj
        let cur_search = this._root._loc.search;
        if(cur_search.charAt(0) == '?') {
            let pairs = cur_search.substr(1).split('&');
            for(var i = 0; i < pairs.length; ++i) {
                let [x, y] = pairs[i].split('=')
                if(x == name) {
                    obj._value = y
                }
            }
        }
    }
    _remove_query(name, obj) {
        if(this._root._last_query_input == name) {
            this._root._last_query_input = null
        }
        if(this._query_fields[name] === obj) {
            delete this._query_fields[name]
        }
        if(this._root._all_fields[name] === obj) {
            delete this._root._all_fields[name]
        }
        // TODO(tailhook) clean the url too (is there use case for it?)
    }
    _update_url(input_name) {
        let qstr = this._query()
        let loc = this._root._loc
        if(loc.search != qstr) {
            if(input_name && this._last_query_input === input_name) {
                this._root._history.replaceState({}, '', loc.pathname + qstr)
            } else {
                this._root._history.pushState({}, '', loc.pathname + qstr)
                this._last_query_input = input_name
            }
        }
    }
    // --------------
    // API
    // --------------
    at(name) {
        if(this._tail[0] == name) {
            return new _Subrouter(this, [name], this._tail.slice(1))
        }
    }
    value(validator=null) {
        let cur = this._tail[0]
        if(validator) {
            let val = validator(cur);
            if(val != null) {
                return [val, new _Subrouter(this, [cur], this._tail.slice(1))]
            }
        } else if(cur) {
            return [cur, new _Subrouter(this, [cur], this._tail.slice(1))]
        }
    }
    query(name, defvalue='') {
        return new _Query(this, name, defvalue)
    }
    rel(path) {
        if(path.charAt(0) == '/') {
            // TODO(tailhook) traverse up and match
            let prefix = this._root._path().join('/');
            return (prefix ? '/' + prefix : '') + path
        }
        let parts = path.split('/')
        return this._rel(parts)
    }
    tail() {
        return this._tail.join('/')
    }
    _rel(parts) {
        let tail = []
        for(let i = 0; i < parts.length; ++i) {
            let item = parts[i];
            switch(item) {
                case '..':
                    if(tail.length > 0) {
                        tail.pop()
                    } else {
                        return this._parent._rel(parts.slice(i+1))
                    }
                    break;
                case '.':
                    break;
                default:
                    tail.push(item);
                    break;
            }
        }
        let npath = '/' + this._path().concat(tail).join('/')
        let query = this._query()
        return npath + query;
    }
    _query() {
        let q = {}
        let cur = this
        while(1) {
            let fields = cur._query_fields
            for(var k in fields) {
                if(k in q)
                    continue
                let qf = fields[k]
                let v = qf._value
                if(v != null && v != qf._default) {
                    q[k] = v
                }
            }
            if(cur._root == cur)
                break;
            cur = cur._parent
        }
        let r = ''
        for(var k in q) {
            if(r) {
                r += '&'
            } else {
                r = '?'
            }
            r += encodeURIComponent(k) + '=' + encodeURIComponent(q[k])
        }
        return r
    }
    // --------------
    // Store protocol
    // --------------
    getState() {
    }
    dispatch(action) {
        switch(action.type) {
            case 'go':
                let rel_path = action.value
                if(action.absolute) {
                    let loc = this._root._loc
                    let abs_prefix = loc.protocol + '//' + loc.host + '/'
                    if(rel_path.substr(0, abs_prefix.length) == abs_prefix) {
                        rel_path = rel_path.substr(abs_prefix.length-1)
                    } else if(rel_path.charAt(0) != '/') {
                        loc.assign(rel_path)
                    }
                    let prefix = this._root._prefix
                    let chunks = rel_path.split('/').filter(x => x)
                    for(var i=0; i < prefix.length; ++i) {
                        if(chunks[i] != prefix[i]) {
                            return loc.assign(rel_path)
                        }
                    }
                    rel_path = '/' + chunks.slice(prefix.length).join('/')
                }
                this._root.go(this.rel(rel_path));
                break;
        }
    }
    subscribe() { return () => null }
}

function strip_prefix(path, prefix) {
    let chunks = path.split('/').filter(x => x)
    for(var i=0; i < prefix.length; ++i) {
        if(chunks[i] != prefix[i]) {
            return []
        }
    }
    return chunks.slice(prefix.length)
}

export class Router extends _BaseRouter {
    constructor(win, prefix='') {
        super(null, [], '')
        this._win = win
        this._history = win.history
        this._loc = win.location

        this.close = this.close.bind(this);
        this._listeners = []
        this._last_query_input = null
        this._all_fields = {}


        if(!prefix || prefix == '' || prefix == '/') {
            prefix = []
        }
        if(typeof prefix == 'string') {
            prefix = prefix.split('/').filter(x => x)
        }
        this._prefix = prefix
        this._parse_location()
        this._pop_state = this._pop_state.bind(this)
        this._hash_change = this._hash_change.bind(this)
        win.addEventListener("popstate", this._pop_state)
        win.addEventListener("hashchange", this._hash_change)
    }
    close() {
        this._win.removeEventListener("popstate", this._pop_state)
        this._win.removeEventListener("hashchange", this._hash_change)
        delete this._win
        delete this._history
        delete this._loc
    }
    subscribe(callback) {
        this._listeners.push(callback);
        return function() {
            let idx = this._listeners.indexOf(callback);
            if(idx >= 0) {
                this._listeners.splice(idx, 1);
            }
        }
    }
    _parse_location() {
        this._tail = strip_prefix(this._loc.pathname, this._prefix)
        for(var k in this._all_fields) {
            let qf = this._all_fields[k];
            qf._value = qf._default
        }
        if(this._loc.search.charAt(0) == '?') {
            let pairs = this._loc.search.substr(1).split('&');
            for(var i = 0; i < pairs.length; ++i) {
                let [x, y] = pairs[i].split('=')
                let qf = this._all_fields[x]
                if(qf) {
                    qf._value = y
                }
            }
        }
        this._render()
    }
    _render() {
        for(let i = 0; i < this._listeners.length; ++i) {
            this._listeners[i]()
        }
    }

    _pop_state(_event) {
        this._last_query_input = null
        this._parse_location()
    }
    _hash_change() {
        this._last_query_input = null
    }
    _path() {
        return this._prefix
    }
    go(url) {
        this._last_query_input = null
        this._history.pushState({}, '', url)
        this._parse_location()
    }
}

class _Subrouter extends _BaseRouter {
    _path() {
        return this._parent._path().concat(this._rel_path)
    }
}

export class _Query {
    constructor(parent, name, defvalue) {
        this._name = name
        this._value = defvalue
        this._default = defvalue
        this._parent = parent
        this._root = parent._root
        this._parent._add_query(name, this)
    }
    dispatch(action) {
        switch(action.type) {
            case CANCEL:
                this._parent._remove_query(this._name)
                break;
            case 'set':
                this._value = action.value
                this._parent._update_url()
                this._root._render()
                break;
            case 'input':
                this._value = action.value
                this._parent._update_url(this._name)
                this._root._render()
                break;
        }
    }
    getState() {
        return this._value
    }
    subscribe() { return () => null }
}

export function go(value) {
    if(value instanceof Event) {
        value.preventDefault()
        return {type: 'go', value: value.currentTarget.href, absolute: true}
    } else {
        return {type: 'go', value: value}
    }
}

export function input(value) {
    if(value instanceof Event) {
        return {type: 'input', value: value.currentTarget.value}
    } else {
        return {type: 'input', value: value}
    }
}

export function set(value) {
    return {type: 'set', value: value}
}
