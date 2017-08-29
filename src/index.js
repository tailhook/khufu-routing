import {CANCEL} from 'khufu-runtime'


export class Router {
    constructor(win) {
        this._win = win
        this._history = win.history
        this._loc = win.location

        this._root = this
        this.close = this.close.bind(this);
        this._listeners = []
        this._query_fields = {}
        this._last_query_input = null

        this._parse_location()
        win.addEventListener("popstate", this._pop_state.bind(this))
        win.addEventListener("hashchange", this._hash_change.bind(this))
    }
    close() {
        this._win.removeEventListener(this._pop_state)
        delete this._root
        delete this._win
    }
    _parse_location() {
        this._parts = this._loc.pathname.split('/').slice(1)
        for(var k in this._query_fields) {
            let qf = this._query_fields[k];
            qf._value = qf._default
        }
        if(this._loc.search.charAt(0) == '?') {
            let pairs = this._loc.search.substr(1).split('&');
            for(var i = 0; i < pairs.length; ++i) {
                let [x, y] = pairs[i].split('=')
                let qf = this._query_fields[x]
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
        console.log("HASH")
    }
    _path() {
        return []
    }
    _add_query(name, obj) {
        this._query_fields[name] = obj
        if(this._loc.search.charAt(0) == '?') {
            let pairs = this._loc.search.substr(1).split('&');
            for(var i = 0; i < pairs.length; ++i) {
                let [x, y] = pairs[i].split('=')
                if(x == name) {
                    obj._value = y
                }
            }
        }
    }
    _remove_query(name, obj) {
        if(this._last_query_input == name) {
            this._last_query_input = null
        }
        if(this._query_fields[name] === obj) {
            delete this._query_fields[name]
        }
    }
    _update_url(input_name) {
        let path = '/' + this._parts.join('/')
        let q = []
        for(var k in this._query_fields) {
            let qf = this._query_fields[k];
            if(qf._value != qf._default) {
                q.push(encodeURIComponent(k) + '=' +
                    encodeURIComponent(qf._value))
            }
        }
        let qstr = q.length ? '?' + q.join('&') : ''
        if(this._loc.pathname != path || this._loc.query != qstr) {
            if(input_name && this._last_query_input === input_name) {
                history.replaceState({}, '', path + qstr)
            } else {
                history.pushState({}, '', path + qstr)
                this._last_query_input = input_name;
            }
        }
    }
    // --------------
    // API
    // --------------
    at(name) {
        if(this._parts[0] == name) {
            return new _Subrouter(this, [name], this._parts.slice(1))
        }
    }
    value(validator=null) {
        let cur = this._parts[0]
        if(validator) {
            let val = validator(cur);
            if(val != null) {
                return [val, new _Subrouter(this, [cur], this._parts.slice(1))]
            }
        } else if(cur) {
            return [val, new _Subrouter(this, [cur], this._parts.slice(1))]
        }
    }
    query(name, defvalue='') {
        return new _Query(this, name, defvalue)
    }
    abs(...parts) {
        return '/' + parts.join('/')
    }
    go(url) {
        this._last_query_input = null
        this._history.pushState({}, '', url)
        this._parse_location()
    }
    // --------------
    // Store protocol
    // --------------
    getState() {
        return this
    }
    dispatch(action) {
        switch(action.type) {
            case 'go':
                this._root.go(action.value)
                break;
        }
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
}

class _Subrouter {
    constructor(parent, rel_path, tail) {
        this._rel_path = rel_path
        this._parent = parent
        this._root = parent._root
        this._tail = tail
        this._query_fields = {}
    }
    _path() {
        let arr = this._parent._path()
        return arr.concat(this._rel_path)
    }
    _remove_query() {

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
        if(path.charAt(0) == '/') return path
        let cur_path = this._path()
        let parts = path.split('/')
        for(let i = 0; i < parts.length; ++i) {
            let item = parts[i];
            switch(item) {
                case '..':
                    cur_path.pop();
                    break;
                case '.':
                    break;
                default:
                    cur_path.push(item);
                    break;
            }
        }
        return '/' + cur_path.join('/')
    }
    // --------------
    // Store protocol
    // --------------
    getState() {
        return this
    }
    dispatch(action) {
        switch(action.type) {
            case 'go':
                this._root.go(this.rel(action.value));
                break;
        }
    }
    subscribe() { return () => null }
}

export class _Query {
    constructor(parent, name, defvalue) {
        this._name = name
        this._value = defvalue
        this._default = defvalue
        this._parent = parent
        this._root = parent._root
        this._root._add_query(name, this)
    }
    dispatch(action) {
        switch(action.type) {
            case CANCEL:
                this._root._remove_query(this._name)
                break;
            case 'set':
                this._value = action.value
                this._root._update_url()
                this._root._render()
                break;
            case 'input':
                this._value = action.value
                this._root._update_url(this._name)
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
        let abs_prefix = location.protocol + '//' + location.host
        let href = value.currentTarget.href
        if(href.substr(0, abs_prefix.length) == abs_prefix) {
            href = href.substr(abs_prefix.length)
        }
        return {type: 'go', value: href}
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
