import {CANCEL} from 'khufu-runtime'


export class Router {
    constructor(win) {
        this._win = win
        this._history = win.history
        this._loc = win.location

        this._root = this
        this.close = this.close.bind(this);
        this._listeners = []
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
        for(let i = 0; i < this._listeners.length; ++i) {
            this._listeners[i]()
        }
    }

    _pop_state(_event) {
        this._parse_location()
    }
    _hash_change() {
        console.log("HASH")
    }
    // API
    at(name) {
        if(this._parts[0] == name) {
            return new _Subrouter(this, [name], this._parts.slice(1))
        }
    }
    query(name, defvalue='') {
        return new _Query(this, name, defvalue)
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
    _path() {
        return []
    }
    abs(...parts) {
        return '/' + parts.join('/')
    }
    go(url) {
        this._history.pushState({}, '', url)
        this._parse_location()
    }
}

class _Subrouter {
    constructor(parent, rel_path, tail) {
        this._rel_path = rel_path
        this._parent = parent
        this._root = parent._root
        this._tail = tail
    }
    _path() {
        let arr = this._parent._path()
        return arr.concat(this._rel_path)
    }
    at(name) {
        if(this._tail[0] == name) {
            return new _Subrouter(this, [name], this._tail.slice(1))
        }
    }
    rel(path) {
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
        this._root = root
        parent._add_query(name)
    }
    getState() {
        return this
    }
    dispatch(action) {
        switch(action.type) {
            case CANCEL:
                parent._remove_query(name)
                break;
            case 'set':
                this._value = action.value
                break;
        }
    }
}

export function go(value) {
    if(value instanceof Event) {
        value.preventDefault()
        return {type: 'go', value: value.currentTarget.href}
    } else {
        return {type: 'go', value: value}
    }
}

export function input(value) {
    if(value instanceof Event) {
        return {type: 'set', value: value.currentTarget.value}
    } else {
        return {type: 'set', value: value}
    }
}
